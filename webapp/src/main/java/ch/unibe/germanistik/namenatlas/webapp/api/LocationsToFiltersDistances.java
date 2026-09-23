/* © 2023 Tivano Software GmbH */
package ch.unibe.germanistik.namenatlas.webapp.api;

import java.io.IOException;
import java.io.OutputStream;
import java.util.Collection;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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
        The `LocationsToFiltersDistances` provides the distances of the distribution of individual `Type`
        entries at a location to the distribution of the same `Type` entries in the distributions for
        each filter in a given list of `NamedFilter` instances.

        All distributions always include all `Type` entries that are matched by any of the provided
        `NamedFilter` instances.
    """
)
public class LocationsToFiltersDistances extends TypesDistributionDistances {

    public LocationsToFiltersDistances(JPAUtil jpa, List<ExistingNamedFilter> filters, Level locationsLevel) {
        super(jpa, filters, locationsLevel);
    }

    public static class FilterDistance {
        @JsonProperty public final int filterId;
        @JsonProperty public final double distance;
        public FilterDistance(int filterId, double distance) {
            this.filterId = filterId;
            this.distance = distance;
        }
    }

    public static class LocationsToFiltersEntry {
        @JsonProperty public final String location;
        @JsonProperty public final Collection<FilterDistance> entries;
        public LocationsToFiltersEntry(String location, Collection<FilterDistance> entries) {
            this.location = location;
            this.entries = entries;
        }
    }

    @ArraySchema(schema = @Schema(implementation = LocationsToFiltersEntry.class))
    @JsonProperty(DATA) Iterable<LocationsToFiltersEntry> data() {
        final Map<Integer, TokensDistribution<Integer>> filterDistributions = filterDistributions();
        final Iterable<Map.Entry<String, TokensDistribution<Integer>>> locationDistributions = locationDistributions();
        return new Iterable<LocationsToFiltersDistances.LocationsToFiltersEntry>() {
            @Override public Iterator<LocationsToFiltersEntry> iterator() {
                return new Iterator<LocationsToFiltersDistances.LocationsToFiltersEntry>() {
                    private final Iterator<Map.Entry<String, TokensDistribution<Integer>>> rawData = locationDistributions.iterator();
                    @Override public boolean hasNext() { return rawData.hasNext(); }
                    @Override public LocationsToFiltersEntry next() {
                        Map.Entry<String, TokensDistribution<Integer>> raw = rawData.next();
                        String locationName = raw.getKey();
                        TokensDistribution<Integer> locationDist = raw.getValue();
                        Collection<FilterDistance> distances = filterDistributions.entrySet()
                            .stream()
                            .map(entry -> new FilterDistance(entry.getKey(), locationDist.distanceTo(entry.getValue())))
                            .collect(Collectors.toList());
                        return new LocationsToFiltersEntry(locationName, distances);
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
        for (LocationsToFiltersEntry entry : data()) {
            OBJECT_MAPPER.writeValue(json, entry);
        }
        json.writeEndArray();
        json.writeStringField(LOCATIONS_LEVEL, locationsLevel.name());
        json.writeEndObject();
        json.close();
    }

}
