/* © 2023 Tivano Software GmbH */
package ch.unibe.germanistik.namenatlas.webapp.api;

import java.io.IOException;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Objects;
import java.util.TreeSet;
import java.util.stream.Collectors;

import org.checkerframework.checker.nullness.qual.Nullable;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.JsonFactory;
import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.querydsl.core.Tuple;
import com.querydsl.core.types.dsl.CaseBuilder;
import com.querydsl.core.types.dsl.CaseBuilder.Cases;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.core.types.dsl.NumberExpression;
import com.querydsl.core.types.dsl.NumberPath;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;

import ch.unibe.germanistik.namenatlas.Location.Level;
import ch.unibe.germanistik.namenatlas.persistence.QTokensEntity;
import ch.unibe.germanistik.namenatlas.query.ExistingNamedFilter;
import ch.unibe.germanistik.namenatlas.query.FilterPredicate;
import ch.unibe.germanistik.namenatlas.query.ImmutableMatchAny;
import ch.unibe.germanistik.namenatlas.webapp.JPAUtil;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(
    description = """
        The `TypesDistribution` describes how individual `Type` entries are distributed for a
        given list of `NamedFilter` instances.

        A `TypesDistribution` value always includes the average distributions for each
        individual `NamedFilter` in the list, and optionally the distributions of the combined
        filters in the list for each individual `Location` selected by any of the filters.

        Each individual distribution is a list of numbers that represents a
        [vector](https://en.wikipedia.org/wiki/Vector_(mathematics_and_physics))
        with one dimension for each individual `Type` matched by the filters list.
        All distribution vectors are normalized (i.e. their length is always 1).
    """
)
public class TypesDistribution {

    @ArraySchema(schema = @Schema(implementation = Double.class))
    public static interface Vector extends Iterable<Double> {}

    private final class SparseTypesVector implements Vector {
        private final Map<String, Integer> tokensByType;
        private final double normalisationFactor;

        private SparseTypesVector(Map<String, Integer> tokensByType,
                double normalisationFactor) {
            this.tokensByType = tokensByType;
            this.normalisationFactor = normalisationFactor;
        }

        @Override public Iterator<Double> iterator() {
            return new Iterator<Double>() {
                private final Iterator<String> dimensions = getTypes().iterator();
                @Override public boolean hasNext() { return dimensions.hasNext(); }
                @Override public Double next() {
                    @Nullable Integer tokens = tokensByType.get(dimensions.next());
                    return tokens == null ? 0.0 : tokens / normalisationFactor;
                }

            };
        }

        private Collection<? extends String> typesWithNonZeroValue() { return tokensByType.keySet(); }
    }

    public abstract class Distribution {
        private final SparseTypesVector data;
        protected Distribution(SparseTypesVector data) {
            this.data = data;
        }
        protected Collection<? extends String> typesWithNonZeroValue() { return data.typesWithNonZeroValue(); }

        @JsonProperty public Vector getVector() { return data; }
    }
    public class FilterDistribution extends Distribution {
        @JsonProperty public final Integer id;
        public FilterDistribution(Integer id, SparseTypesVector data) {
            super(data);
            this.id = id;
        }
    }
    public class LocationDistribution extends Distribution {
        @JsonProperty public final String name;
        public LocationDistribution(String name, SparseTypesVector data) {
            super(data);
            this.name = name;
        }
    }

    private final JPAUtil jpa;
    private final List<ExistingNamedFilter> filters;

    // QueryDSL definitions used in both queries
    private static final QTokensEntity TOKENS = QTokensEntity.tokensEntity;
    private final FilterPredicate WHERE_CLAUSE;


    private @Nullable Collection<String> types = null;
    private @Nullable Collection<FilterDistribution> filterDistributions = null;

    // JSON property labels (used when streaming)
    public static final String LOCATIONS_LEVEL = "locationsLevel";
    public static final String TYPES = "types";
    public static final String FILTER_DISTRIBUTIONS = "filterDistributions";
    public static final String LOCATION_DISTRIBUTIONS = "locationDistributions";

    @Schema(description = "the geographical resolution of the locations")
    @JsonProperty(LOCATIONS_LEVEL) private final @Nullable Level locationsLevel;

    @ArraySchema(
        arraySchema = @Schema(description = """
            the list of `Type` entries in this distribution.
            Each item here corresponds directly to one dimension in the distribution vectors.
        """)
    )
    @JsonProperty(TYPES) public Collection<String> getTypes() {
        if (types == null) {
            types = getFilterDistributions()
                .stream()
                .flatMap(d -> d.typesWithNonZeroValue().stream())
                .collect(Collectors.toCollection(TreeSet::new));
        }
        return types;
    }

    @ArraySchema(arraySchema = @Schema(description = "average distributions for each filter"))
    @JsonProperty(FILTER_DISTRIBUTIONS) public Collection<FilterDistribution> getFilterDistributions() {
        if (this.filterDistributions == null) {
            final NumberPath<Integer> filterID = Expressions.numberPath(Integer.class, "filterID");
            final NumberPath<Integer> tokensCount = Expressions.numberPath(Integer.class, "tokensCount");

            final NumberExpression<Integer> FILTER_ID_SELECTION;
            if (filters.size() == 1) {
                // Only one filter, FILTER_ID_SELECTION can be constant
                FILTER_ID_SELECTION = Expressions.numberTemplate(Integer.class, Integer.toString(filters.iterator().next().getId()));
            } else {
                // Multiple filters, need a case expression for the filter ID
                Iterator<ExistingNamedFilter> groups = filters.iterator();
                ExistingNamedFilter current = groups.next();
                Cases<Integer, NumberExpression<Integer>> caseBuilder = new CaseBuilder()
                    .when(current.getFilter().querydslPredicate(TOKENS))
                    .then(current.getId());
                while (groups.hasNext()) {
                    current = groups.next();
                    if (groups.hasNext()) {
                        // Add cases for all but the last filter
                        caseBuilder = caseBuilder
                        .when(current.getFilter().querydslPredicate(TOKENS))
                        .then(current.getId());
                    }
                }
                // Last filter ID is added as the "otherwise" case statement
                FILTER_ID_SELECTION = caseBuilder.otherwise(current.getId());
            }

            JPAQuery<Tuple> query = new JPAQuery<>(jpa.entityManager())
                .select(FILTER_ID_SELECTION.as(filterID), TOKENS.type.name, TOKENS.tokens.sum().as(tokensCount))
                .from(TOKENS)
                .where(WHERE_CLAUSE.querydslPredicate(TOKENS))
                .groupBy(Expressions.ONE, Expressions.TWO)
                .orderBy(Expressions.ONE.asc(), Expressions.TWO.asc());
            final Iterator<Tuple> data = query.stream().iterator();
            if (data.hasNext()) {
                @Nullable Tuple current = data.next();
                int currentFilterID = Objects.requireNonNull(current.get(filterID));
                Collection<FilterDistribution> result = new ArrayList<>(filters.size());
                Map<String, Integer> tokensByType = new HashMap<>();
                double sumTokensSquared = 0.0;
                while (current != null) {
                    if (currentFilterID != Objects.requireNonNull(current.get(filterID))) {
                        SparseTypesVector vector = new SparseTypesVector(tokensByType, Math.sqrt(sumTokensSquared));
                        result.add(new FilterDistribution(currentFilterID, vector));
                        tokensByType = new HashMap<>();
                        sumTokensSquared = 0.0;
                        currentFilterID = Objects.requireNonNull(current.get(filterID));
                    }
                    int tokens = Objects.requireNonNull(current.get(tokensCount));
                    @Nullable String type = Objects.requireNonNull(current.get(TOKENS.type.name));
                    sumTokensSquared += (long)tokens * (long)tokens;
                    tokensByType.put(type, tokens);
                    current = data.hasNext() ? data.next() : null;
                }
                SparseTypesVector vector = new SparseTypesVector(tokensByType, Math.sqrt(sumTokensSquared));
                result.add(new FilterDistribution(currentFilterID, vector));
                this.filterDistributions = Collections.unmodifiableCollection(result);
            } else {
                this.filterDistributions = Collections.emptySet();
            }
        }
        return this.filterDistributions;
    }

    @ArraySchema(arraySchema = @Schema(description = "distributions for each location"), schema = @Schema(implementation = LocationDistribution.class))
    @JsonProperty(LOCATION_DISTRIBUTIONS) public @Nullable Iterable<LocationDistribution> getLocationDistributions() {
        if (locationsLevel == null) {
            return null;
        } else {
            final StringPath locationName;
            switch (locationsLevel) {
                case NAME: locationName = TOKENS.location.name; break;
                case MUNICIPALITY: locationName = TOKENS.location.municipality; break;
                case DISTRICT: locationName = TOKENS.location.district; break;
                case CANTON: locationName = TOKENS.location.canton; break;
                case COUNTRY: locationName = TOKENS.location.country; break;
                default: throw new IllegalStateException("Unsupported locations level: " + locationsLevel);
            }

            final NumberPath<Integer> tokensCount = Expressions.numberPath(Integer.class, "tokensCount");
            final JPAQuery<Tuple> query = new JPAQuery<>(jpa.entityManager())
                .select(locationName, TOKENS.type.name, TOKENS.tokens.sum().as(tokensCount))
                .from(TOKENS)
                .where(WHERE_CLAUSE.querydslPredicate(TOKENS))
                .groupBy(Expressions.ONE, Expressions.TWO)
                .orderBy(Expressions.ONE.asc(), Expressions.TWO.asc());

            return new Iterable<TypesDistribution.LocationDistribution>() {
                @Override public Iterator<LocationDistribution> iterator() {
                    return new Iterator<TypesDistribution.LocationDistribution>() {
                        final Iterator<Tuple> rawData = query.stream().iterator();
                        @Nullable Tuple currentRaw = rawData.hasNext() ? rawData.next() : null;

                        @Override public boolean hasNext() { return currentRaw != null; }
                        @Override public LocationDistribution next() {
                            @Nullable Tuple current = this.currentRaw;
                            if (current != null) {
                                String location = Objects.requireNonNull(current.get(locationName));
                                Map<String, Integer> tokensByType = new HashMap<>();
                                double sumTokensSquared = 0.0;
                                while (current != null && location.equals(current.get(locationName))) {
                                    String type = Objects.requireNonNull(current.get(TOKENS.type.name));
                                    int tokens = Objects.requireNonNull(current.get(tokensCount));
                                    sumTokensSquared += (long)tokens * (long)tokens;
                                    tokensByType.put(type, tokens);
                                    current = rawData.hasNext() ? rawData.next() : null;
                                }
                                this.currentRaw = current;
                                SparseTypesVector vector = new SparseTypesVector(tokensByType, Math.sqrt(sumTokensSquared));
                                return new LocationDistribution(location, vector);
                            } else {
                                throw new NoSuchElementException();
                            }
                        }
                    };
                }
            };
        }
    }

    public TypesDistribution(JPAUtil jpa, List<ExistingNamedFilter> filters, @Nullable Level locationsLevel) {
        this.jpa = jpa;
        this.locationsLevel = locationsLevel;
        this.filters = filters;

        ImmutableMatchAny.Builder b = ImmutableMatchAny.builder();
        filters.forEach(f -> b.addFilters(f.getFilter()));
        this.WHERE_CLAUSE = b.build();
    }

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final JsonFactory JSON_FACTORY = new JsonFactory();
    public void writeJSON(OutputStream out) throws IOException {
        // Keep this in sync with the OpenAPI interface!
        JsonGenerator json = JSON_FACTORY.createGenerator(out);

        json.writeStartObject();

        json.writeFieldName(TYPES);
        json.writeStartArray();
        for (String type : getTypes()) {
            json.writeString(type);
        }
        json.writeEndArray();

        if (locationsLevel != null) {
            json.writeStringField(LOCATIONS_LEVEL, locationsLevel.name());
        }

        json.writeFieldName(FILTER_DISTRIBUTIONS);
        json.writeStartArray();
        for (FilterDistribution entry : getFilterDistributions()) {
            OBJECT_MAPPER.writeValue(json, entry);
        }
        json.writeEndArray();

        @Nullable Iterable<LocationDistribution> locationDistributions = getLocationDistributions();
        if (locationDistributions != null) {
            json.writeFieldName(LOCATION_DISTRIBUTIONS);
            json.writeStartArray();
            for (LocationDistribution entry : locationDistributions) {
                OBJECT_MAPPER.writeValue(json, entry);
            }
            json.writeEndArray();
        }
        json.writeEndObject();
        json.close();
    }

}
