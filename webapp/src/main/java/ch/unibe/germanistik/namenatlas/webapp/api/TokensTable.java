/* © 2022 Tivano Software GmbH */
package ch.unibe.germanistik.namenatlas.webapp.api;

import java.io.IOException;
import java.io.OutputStream;
import java.util.Collections;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.checkerframework.checker.nullness.qual.Nullable;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.JsonFactory;
import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.opencsv.ICSVWriter;
import com.querydsl.core.Tuple;
import com.querydsl.core.types.Expression;
import com.querydsl.core.types.NullExpression;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.CaseBuilder;
import com.querydsl.core.types.dsl.CaseBuilder.Cases;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.core.types.dsl.NumberPath;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.JPAExpressions;
import com.querydsl.jpa.JPQLQuery;
import com.querydsl.jpa.impl.JPAQuery;

import ch.unibe.germanistik.namenatlas.Location;
import ch.unibe.germanistik.namenatlas.persistence.QLocationEntity;
import ch.unibe.germanistik.namenatlas.persistence.QTokensEntity;
import ch.unibe.germanistik.namenatlas.query.FilterPredicate;
import ch.unibe.germanistik.namenatlas.query.ImmutableMatchAny;
import ch.unibe.germanistik.namenatlas.query.NamedFilter;
import ch.unibe.germanistik.namenatlas.webapp.CSVUtils;
import ch.unibe.germanistik.namenatlas.webapp.JPAUtil;
import ch.unibe.germanistik.namenatlas.webapp.api.Query.Grouping;
import ch.unibe.germanistik.namenatlas.webapp.api.Query.TypesLevel;
import ch.unibe.germanistik.namenatlas.webapp.api.TokensTable.TokensTableRow;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;


@ArraySchema(schema = @Schema(implementation = TokensTableRow.class))
public class TokensTable {

    private final JPAUtil jpa;
    private final FilterPredicate filter;
    private final Expression<String> outerGroup;
    private final @Nullable Expression<String> outerSubgroup;
    private final Expression<String> innerGroup;
    private final @Nullable Expression<String> innerSubgroup;
    private final Expression<String> locationGroup;
    private final Function<RawResult,String> locationLabel;
    private final Location.Level locationsLevel;
    private static final QTokensEntity tokens = QTokensEntity.tokensEntity;

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final JsonFactory JSON_FACTORY = new JsonFactory();

    public TokensTable(
        JPAUtil jpa,
        List<NamedFilter> filters,
        Location.Level locationsLevel,
        TypesLevel typesLevel,
        Grouping outerGroupType)
    {
        this.jpa = jpa;

        if (filters.size() == 1) {
            this.filter = filters.iterator().next().getFilter();
        } else {
            ImmutableMatchAny.Builder b = ImmutableMatchAny.builder();
            filters.forEach(f -> b.addFilters(f.getFilter()));
            this.filter = b.build();
        }

        this.locationsLevel = locationsLevel;
        this.locationGroup = locationGroup(tokens.location, locationsLevel);

        Expression<String> typesGroup;
        @Nullable Expression<String> typesSubgroup;
        if (typesLevel == TypesLevel.INDIVIDUAL) {
            typesGroup = tokens.type.name;
            typesSubgroup = null;
        } else {
            Iterator<NamedFilter> groups = filters.iterator();
            NamedFilter current = groups.next();
            Cases<String, ?> caseBuilder = new CaseBuilder()
                .when(current.getFilter().querydslPredicate(tokens))
                .then(current.getName());
            while (groups.hasNext()) {
                current = groups.next();
                caseBuilder = caseBuilder
                    .when(current.getFilter().querydslPredicate(tokens))
                    .then(current.getName());
            }
            if (typesLevel == TypesLevel.GROUPED) {
                typesGroup = caseBuilder.otherwise(current.getName());
                typesSubgroup = null;
            } else {
                typesGroup = tokens.type.name;
                typesSubgroup = caseBuilder.otherwise(current.getName());
            }
        }

        if (outerGroupType == Grouping.LOCATIONS) {
            this.outerGroup = locationGroup;
            this.outerSubgroup = null;
            this.innerGroup = typesGroup;
            this.innerSubgroup = typesSubgroup;
            this.locationLabel = RawResult::getOuterLabel;
        } else {
            this.outerGroup = typesGroup;
            this.outerSubgroup = typesSubgroup;
            this.innerGroup = locationGroup;
            this.innerSubgroup = null;
            this.locationLabel = RawResult::getInnerLabel;
        }
    }

    public static class RawResult {
        private final String outerLabel;
        private final @Nullable String outerSublabel;
        private final String innerLabel;
        private final @Nullable String innerSublabel;
        private final int count;
        public RawResult(String outerLabel, @Nullable String outerSublabel, String innerLabel, @Nullable String innerSublabel, int count) {
            this.outerLabel = outerLabel;
            this.outerSublabel = outerSublabel;
            this.innerLabel = innerLabel;
            this.innerSublabel = innerSublabel;
            this.count = count;
        }
        public String getOuterLabel() { return outerLabel; }
        public String getInnerLabel() { return innerLabel; }
        public @Nullable String getOuterSublabel() { return outerSublabel; }
        public @Nullable String getInnerSublabel() { return innerSublabel; }
        public int getCount() { return count; }
    }

    public static class RawHeader {
        private final String header;
        private final @Nullable String subHeader;
        public RawHeader(String header, @Nullable String subHeader) {
            this.header = header;
            this.subHeader = subHeader;
        }
        public String getHeader() { return header; }
        public @Nullable String getSubHeader() { return subHeader; }
        @Override
        public int hashCode() {
            return Objects.hash(header, subHeader);
        }
        @Override
        public boolean equals(@Nullable Object obj) {
            if (this == obj) {
                return true;
            }
            if (obj == null) {
                return false;
            }
            if (getClass() != obj.getClass()) {
                return false;
            }
            RawHeader other = (RawHeader) obj;
            return Objects.equals(header, other.header) && Objects.equals(subHeader, other.subHeader);
        }

    }

    /** Used ony to define the OpenAPI interface - not really used in Java code. */
    public interface TokensTableRow {
        public static final String LABEL = "label";
        public static final String SUBLABEL = "sublabel";
        public static final String ENTRIES = "entries";
        public static final String TOTAL_ABS = "totalAbs";
        public static final String TOTAL_REL = "totalRel";
        @JsonProperty(LABEL) public String getLabel();
        @JsonProperty(SUBLABEL) public @Nullable String getSublabel();
        @JsonProperty(ENTRIES) public TokensEntry[] getEntries();
        @JsonProperty(TOTAL_ABS) public long getTotalAbs();
        @JsonProperty(TOTAL_REL) public double getTotalRel();
    }

    public static final class TokensEntry {
        private final String label;
        private final @Nullable String sublabel;
        private final int tokensAbs;
        private final @Nullable Double tokensRel;
        public TokensEntry(String label, @Nullable String sublabel, int tokens, @Nullable Integer totalForLocation) {
            this.label = label;
            this.sublabel = sublabel;
            this.tokensAbs = tokens;
            if (totalForLocation != null && totalForLocation > 0) {
                tokensRel = (double)tokens / (double)totalForLocation;
            } else {
                tokensRel = null;
            }
        }

        public String getLabel() { return label; }
        public @Nullable String getSublabel() { return sublabel; }
        public int getTokensAbs() { return tokensAbs; }
        public @Nullable Double getTokensRel() { return tokensRel; }
    }

    private JPAQuery<RawResult> query()
    {
        return new JPAQuery<>(jpa.entityManager())
            .select(Projections.constructor(
                    RawResult.class,
                    outerGroup,
                    outerSubgroup==null?new NullExpression<>(String.class):outerSubgroup,
                    innerGroup,
                    innerSubgroup==null?new NullExpression<>(String.class):innerSubgroup,
                    tokens.tokens.sum()
                )
            )
            .from(tokens)
            .where(filter.querydslPredicate(tokens))
            .groupBy(Expressions.ONE, Expressions.TWO, Expressions.THREE, Expressions.FOUR)
            .orderBy(Expressions.ONE.asc(), Expressions.TWO.asc(), Expressions.THREE.asc(), Expressions.FOUR.asc());
    }

    private Map<String,Integer> totals()
    {

        QTokensEntity locationsRoot = new QTokensEntity("tokensWithLocation");
        QTokensEntity layersRoot = new QTokensEntity("tokensWithLayer");
        JPQLQuery<String> locationsQuery = JPAExpressions
            .select(locationGroup(locationsRoot.location, this.locationsLevel))
            .distinct()
            .from(locationsRoot)
            .where(filter.querydslPredicate(locationsRoot));
        JPQLQuery<Integer> layersQuery = JPAExpressions
            .select(layersRoot.layer.primaryKey)
            .distinct()
            .from(layersRoot)
            .where(filter.querydslPredicate(layersRoot));

        NumberPath<Integer> total = Expressions.numberPath(Integer.class, "total");
        JPAQuery<Tuple> query = new JPAQuery<>(jpa.entityManager())
            .select(locationGroup, tokens.tokens.sum().as(total))
            .from(tokens)
            .where(
                locationGroup(tokens.location, this.locationsLevel).in(locationsQuery)
                .and(tokens.layer.primaryKey.in(layersQuery))
             )
            .groupBy(Expressions.ONE)
            .orderBy(Expressions.ONE.asc());
        return query.stream().collect(Collectors.toUnmodifiableMap(
            t -> t.get(locationGroup),
            t -> t.get(total)
        ));
    }

    private List<RawHeader> headers()
    {
        JPAQuery<RawHeader> query = new JPAQuery<>(jpa.entityManager())
            .select(Projections.constructor(
                    RawHeader.class,
                    innerGroup,
                    innerSubgroup==null?new NullExpression<>(String.class):innerSubgroup
                )
            )
            .distinct()
            .from(tokens)
            .where(filter.querydslPredicate(tokens))
            .orderBy(Expressions.ONE.asc(), Expressions.TWO.asc());
        return query.stream().collect(Collectors.toList());
    }

    public void writeCSV(OutputStream out) throws IOException {
        final ICSVWriter csvWriter = CSVUtils.createWriter(out, CSVUtils.Codec.UTF8);
        final List<RawHeader> headers = headers();
        final boolean haveSubheaders = innerSubgroup != null;
        final boolean haveSubgroupColumn = outerSubgroup != null;
        final int headerStart = haveSubgroupColumn?2:1;
        final int headerLength = headers.size() + headerStart;
        final String[] headersAsArray = new String[headerLength];
        headersAsArray[0] = "";
        if (haveSubgroupColumn) {
            headersAsArray[1] = "";
        }
        for (int i = headerStart; i < headerLength; i++) {
            RawHeader entry = headers.get(i - headerStart);
            headersAsArray[i] = entry.getHeader();
        }
        csvWriter.writeNext(headersAsArray);
        if (haveSubheaders) {
            for (int i = 1; i < headerLength; i++) {
                RawHeader entry = headers.get(i - headerStart);
                String subHeader = entry.getSubHeader();
                headersAsArray[i] = subHeader==null?"":subHeader;
            }
            csvWriter.writeNext(headersAsArray);
        }
        final Iterator<RawResult> data = query().stream().iterator();
        @Nullable RawResult current = data.hasNext() ? data.next() : null;
        while (current != null) {
            final String outerLabel = current.getOuterLabel();
            final @Nullable String outerSublabel = current.getOuterSublabel();
            final Map<RawHeader, Integer> lineMap = new HashMap<>();
            while (current != null && Objects.equals(outerLabel, current.getOuterLabel()) && Objects.equals(outerSublabel, current.getOuterSublabel())) {
                final RawHeader header = new RawHeader(current.getInnerLabel(), current.getInnerSublabel());
                final Integer count = current.getCount();
                lineMap.put(header, count);
                current = data.hasNext() ? data.next() : null;
            }
            final List<String> lineList = headers.stream()
                .map(header -> lineMap.get(header) == null ? 0 : lineMap.get(header))
                .map(count -> String.valueOf(count))
                .collect(Collectors.toList());
            final int lineArrayLength = lineList.size() + headerStart;
            final String[] lineArray = new String[lineArrayLength];
            lineArray[0] = outerLabel;
            if (haveSubgroupColumn) {
                lineArray[1] = outerSublabel==null?"":outerSublabel;
            }
            for (int i = headerStart; i < lineArrayLength; i++) {
                lineArray[i] = lineList.get(i - headerStart);
            }
            csvWriter.writeNext(lineArray);
        }
        csvWriter.close();
    }

    public void writeJSON(OutputStream out, boolean absoluteOnly) throws IOException {
        Map<String,Integer> totals = absoluteOnly?Collections.emptyMap():totals();
        Iterator<RawResult> data = query().stream().iterator();

        // Keep this in sync with the specified OpenAPI interface for TokensTable.
        JsonGenerator json = JSON_FACTORY.createGenerator(out);
        json.writeStartArray();
        @Nullable RawResult current = data.hasNext() ? data.next() : null;
        while (current != null) {
            String outerLabel = current.getOuterLabel();
            @Nullable String outerSublabel = current.getOuterSublabel();
            long rowTotalAbs = 0;
            double rowTotalRel = 0;
            // Start a TokensTableRow
            json.writeStartObject();
            json.writeStringField(TokensTableRow.LABEL, outerLabel);
            if (outerSublabel != null) {
                json.writeStringField(TokensTableRow.SUBLABEL, outerSublabel);
            } else {
                // Explicitly write a null field to stay consistent with the TokensEntry output.
                json.writeNullField(TokensTableRow.SUBLABEL);
            }
            json.writeFieldName(TokensTableRow.ENTRIES);

            // Write the entries in this row
            json.writeStartArray();
            while (current != null && Objects.equals(outerLabel, current.getOuterLabel()) && Objects.equals(outerSublabel, current.getOuterSublabel())) {
                Integer totalForLocation = absoluteOnly
                    ? null
                    : totals.get(locationLabel.apply(current));
                TokensEntry entry = new TokensEntry(current.getInnerLabel(), current.getInnerSublabel(), current.getCount(), totalForLocation);
                final Double tokensRel = entry.getTokensRel();
                rowTotalAbs += entry.getTokensAbs();
                rowTotalRel += (tokensRel == null ? 0 : tokensRel);
                OBJECT_MAPPER.writeValue(json, entry);
                current = data.hasNext() ? data.next() : null;
            }
            json.writeEndArray();

            // Finish the TokensTableRow
            json.writeNumberField(TokensTableRow.TOTAL_ABS, rowTotalAbs);
            if (!absoluteOnly) {
                json.writeNumberField(TokensTableRow.TOTAL_REL, rowTotalRel);
            }
            json.writeEndObject();
        }
        json.writeEndArray();
        json.close();
    }

    private static StringPath locationGroup(QLocationEntity location, Location.Level locationsLevel) {
        switch (locationsLevel) {
            case CANTON:
                return location.canton;
            case COUNTRY:
                return location.country;
            case DISTRICT:
                return location.district;
            case MUNICIPALITY:
                return location.municipality;
            case NAME:
            default:
                return location.name;
        }
    }

}
