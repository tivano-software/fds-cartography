/* © 2023 Tivano Software GmbH */
package ch.unibe.germanistik.namenatlas.webapp.api;

import java.util.AbstractMap;
import java.util.Collections;
import java.util.HashMap;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Objects;

import org.checkerframework.checker.nullness.qual.Nullable;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.JsonFactory;
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
import ch.unibe.germanistik.namenatlas.Type;
import ch.unibe.germanistik.namenatlas.distribution.TokensDistribution;
import ch.unibe.germanistik.namenatlas.persistence.QTokensEntity;
import ch.unibe.germanistik.namenatlas.query.ExistingNamedFilter;
import ch.unibe.germanistik.namenatlas.query.FilterPredicate;
import ch.unibe.germanistik.namenatlas.query.ImmutableMatchAny;
import ch.unibe.germanistik.namenatlas.query.NamedFilter;
import ch.unibe.germanistik.namenatlas.webapp.JPAUtil;
import io.swagger.v3.oas.annotations.media.Schema;

public abstract class TypesDistributionDistances {
    // JSON property labels (used when streaming)
    public static final String LOCATIONS_LEVEL = "locationsLevel";
    public static final String LOCATIONS = "locations";
    public static final String DATA = "data";

    protected static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    protected static final JsonFactory JSON_FACTORY = new JsonFactory();

    private final JPAUtil jpa;
    private final List<ExistingNamedFilter> filters;

    // QueryDSL definitions used in both queries
    private static final QTokensEntity TOKENS = QTokensEntity.tokensEntity;
    private final FilterPredicate WHERE_CLAUSE;

    @Schema(description = "the geographical resolution of the locations")
    @JsonProperty(LOCATIONS_LEVEL) protected final Level locationsLevel;

    private @Nullable Map<Integer, TokensDistribution<Integer>> filterDistributionsByFilterId = null;

    /**
     * Get the token distributions for the filters in the query. Distributions are indexed
     * by {@linkplain ExistingNamedFilter#getId() filter id}, and the types in each distribution
     * are indexed by {@linkplain Type#getId() type id} (which makes them compatible to the distributions
     * returned by {@link #locationDistributions()}).
     */
    protected Map<Integer, TokensDistribution<Integer>> filterDistributions() {
        if (this.filterDistributionsByFilterId == null) {
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
                .select(FILTER_ID_SELECTION.as(filterID), TOKENS.type.id, TOKENS.tokens.sum().as(tokensCount))
                .from(TOKENS)
                .where(WHERE_CLAUSE.querydslPredicate(TOKENS))
                .groupBy(Expressions.ONE, Expressions.TWO)
                .orderBy(Expressions.ONE.asc(), Expressions.TWO.asc());
            final Iterator<Tuple> data = query.stream().iterator();
            if (data.hasNext()) {
                @Nullable Tuple current = data.next();
                int currentFilterID = Objects.requireNonNull(current.get(filterID));
                Map<Integer, TokensDistribution<Integer>> result = new LinkedHashMap<>();
                Map<Integer, Integer> tokensByType = new HashMap<>();
                while (current != null) {
                    if (currentFilterID != Objects.requireNonNull(current.get(filterID))) {
                        TokensDistribution<Integer> distribution = new TokensDistribution<>(tokensByType);
                        result.put(currentFilterID, distribution);
                        tokensByType = new HashMap<>();
                        currentFilterID = Objects.requireNonNull(current.get(filterID));
                    }
                    int tokens = Objects.requireNonNull(current.get(tokensCount));
                    Integer typeId = Objects.requireNonNull(current.get(TOKENS.type.id));
                    tokensByType.put(typeId, tokens);
                    current = data.hasNext() ? data.next() : null;
                }
                TokensDistribution<Integer> distribution = new TokensDistribution<>(tokensByType);
                result.put(currentFilterID, distribution);
                this.filterDistributionsByFilterId = Collections.unmodifiableMap(result);
            } else {
                this.filterDistributionsByFilterId = Collections.emptyMap();
            }
        }
        return this.filterDistributionsByFilterId;
    }

    /**
     * Get the token distributions for the locations in the query.
     * Uses the {@linkplain Type#getId() type id} as the key for the types in the distribution
     * (which makes them compatible with the distributions returned by {@link #filterDistributions()}),
     * and the location data tag corresponding to the selected location level as the key
     * for each returned {@link Map.Entry}.
     */
    protected Iterable<Map.Entry<String, TokensDistribution<Integer>>> locationDistributions() {
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
            .select(locationName, TOKENS.type.id, TOKENS.tokens.sum().as(tokensCount))
            .from(TOKENS)
            .where(WHERE_CLAUSE.querydslPredicate(TOKENS))
            .groupBy(Expressions.ONE, Expressions.TWO)
            .orderBy(Expressions.ONE.asc(), Expressions.TWO.asc());

        return new Iterable<Map.Entry<String, TokensDistribution<Integer>>>() {
            @Override public Iterator<Map.Entry<String, TokensDistribution<Integer>>> iterator() {
                return new Iterator<Map.Entry<String, TokensDistribution<Integer>>>() {
                    final Iterator<Tuple> rawData = query.stream().iterator();
                    @Nullable Tuple currentRaw = rawData.hasNext() ? rawData.next() : null;

                    @Override public boolean hasNext() { return currentRaw != null; }
                    @Override public Map.Entry<String, TokensDistribution<Integer>> next() {
                        @Nullable Tuple current = this.currentRaw;
                        if (current != null) {
                            String location = Objects.requireNonNull(current.get(locationName));
                            Map<Integer, Integer> tokensByTypeId = new HashMap<>();
                            while (current != null && location.equals(current.get(locationName))) {
                                Integer typeId = Objects.requireNonNull(current.get(TOKENS.type.id));
                                int tokens = Objects.requireNonNull(current.get(tokensCount));
                                tokensByTypeId.put(typeId, tokens);
                                current = rawData.hasNext() ? rawData.next() : null;
                            }
                            this.currentRaw = current;
                            TokensDistribution<Integer> distribution = new TokensDistribution<>(tokensByTypeId);
                            return new AbstractMap.SimpleEntry<>(location, distribution);
                        } else {
                            throw new NoSuchElementException();
                        }
                    }
                };
            }
        };
    }

    public TypesDistributionDistances(JPAUtil jpa, List<ExistingNamedFilter> filters, Level locationsLevel) {
        this.jpa = jpa;
        this.locationsLevel = locationsLevel;
        this.filters = filters;

        ImmutableMatchAny.Builder b = ImmutableMatchAny.builder();
        filters.forEach(f -> b.addFilters(f.getFilter()));
        this.WHERE_CLAUSE = b.build();
    }
}
