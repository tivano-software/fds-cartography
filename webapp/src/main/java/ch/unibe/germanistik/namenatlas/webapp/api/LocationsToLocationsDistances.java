/* © 2023 Tivano Software GmbH */
package ch.unibe.germanistik.namenatlas.webapp.api;

import java.io.IOException;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.JsonGenerator;

import ch.unibe.germanistik.namenatlas.Location.Level;
import ch.unibe.germanistik.namenatlas.distribution.TokensDistribution;
import ch.unibe.germanistik.namenatlas.query.ExistingNamedFilter;
import ch.unibe.germanistik.namenatlas.webapp.JPAUtil;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(
    description = """
        The `LocationsToLocationsDistances` provides the distance matrix of the distribution of individual `Type`
        entries at a location to the distribution of the `Type` entries in all other locations matched by
        the given list of `NamedFilter` instances.

        All distributions always include all `Type` entries that are matched by any of the provided
        `NamedFilter` instances.

        Because the distances are symmetrical (i.e. the distance from A to B is the same as the distance from B to A),
        the distance matrix is symmetrical as well. To save bandwidth, the result only includes the lower triangular
        half of the matrix, excluding the entries on the diagonal (these are all 0 because the distance from
        A to A is always 0). To get the distance for any pair (i,j) of indexes, return `data[i,j]` if _i<j_,
        `0` if _i=0_, and `data[j,i]` if i>j.
    """
)
public class LocationsToLocationsDistances extends TypesDistributionDistances {

    public LocationsToLocationsDistances(JPAUtil jpa, List<ExistingNamedFilter> filters, Level locationsLevel) {
        super(jpa, filters, locationsLevel);
    }

    public static class LocationsToLocationsEntry {
        private final Iterable<TokensDistribution<Integer>> colDists;
        private final TokensDistribution<Integer> rowDist;
        @JsonProperty public final String location;
        public LocationsToLocationsEntry(String location, Iterable<TokensDistribution<Integer>> colDists, TokensDistribution<Integer> rowDist) {
            this.colDists = colDists;
            this.rowDist  = rowDist;
            this.location = location;
        }

        @ArraySchema(schema = @Schema(implementation = Double.class), arraySchema = @Schema(
            description = """
                Distances to all location entries above the current entry in the list.
            """
        ))
        @JsonProperty public Iterable<Double> distances() {
            return new Iterable<Double>() {
                @Override public Iterator<Double> iterator() {
                    return new Iterator<Double>() {
                        private Iterator<TokensDistribution<Integer>> dists = colDists.iterator();
                        @Override public boolean hasNext() { return dists.hasNext(); }
                        public Double next() { return dists.next().distanceTo(rowDist); }
                    };
                }
            };
        }
    }

    private static class TokenDistributionsAccumulator {
        private final List<TokensDistribution<Integer>> data = new ArrayList<>();
        public void add(TokensDistribution<Integer> value) { data.add(value);}
        public Iterable<TokensDistribution<Integer>> snapshot() {
            return new Iterable<TokensDistribution<Integer>>() {
                private final int end = data.size();
                @Override public Iterator<TokensDistribution<Integer>> iterator() {
                    return new Iterator<TokensDistribution<Integer>>() {
                        int current = 0;
                        public boolean hasNext() { return current<end; }
                        @Override public TokensDistribution<Integer> next() {
                            try {
                                return data.get(current++);
                            } catch (IndexOutOfBoundsException e) {
                                throw new NoSuchElementException();
                            }
                        }

                    };
                }
            };
        }
    }


    @ArraySchema(schema = @Schema(implementation = LocationsToLocationsEntry.class))
    @JsonProperty(DATA) Iterable<LocationsToLocationsEntry> data() {
        final Iterable<Map.Entry<String, TokensDistribution<Integer>>> locationDistributions = locationDistributions();
        return new Iterable<LocationsToLocationsEntry>() {
            @Override public Iterator<LocationsToLocationsEntry> iterator() {
                return new Iterator<LocationsToLocationsEntry>() {
                    private final Iterator<Map.Entry<String, TokensDistribution<Integer>>> rawData = locationDistributions.iterator();
                    private final TokenDistributionsAccumulator colDists = new TokenDistributionsAccumulator();
                    @Override public boolean hasNext() { return rawData.hasNext(); }
                    @Override public LocationsToLocationsEntry next() {
                        Map.Entry<String, TokensDistribution<Integer>> rowEntry = rawData.next();
                        String locationName = rowEntry.getKey();
                        TokensDistribution<Integer> rowDist = rowEntry.getValue();
                        LocationsToLocationsEntry row = new LocationsToLocationsEntry(locationName, colDists.snapshot(), rowDist);
                        if (hasNext()) { colDists.add(rowDist); }
                        return row;
                    }
                };
            }
        };
    }

    public void writeJSON(OutputStream out) throws IOException {
        JsonGenerator json = JSON_FACTORY.createGenerator(out);
        // Keep this in sync with the OpenAPI interface!
        json.writeStartObject();
        json.writeFieldName(DATA);
        json.writeStartArray();
        for (LocationsToLocationsEntry entry : data()) {
            OBJECT_MAPPER.writeValue(json, entry);
        }
        json.writeEndArray();
        json.writeStringField(LOCATIONS_LEVEL, locationsLevel.name());
        json.writeEndObject();
        json.close();
    }

}
