/* (C) 2022 Tivano Software GmbH */
package ch.unibe.germanistik.namenatlas.datapreparation;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.Spliterator;
import java.util.Spliterators;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import java.util.stream.StreamSupport;

import com.opencsv.bean.CsvBindByName;
import com.opencsv.exceptions.CsvException;

import org.checkerframework.checker.nullness.qual.Nullable;

import ch.unibe.germanistik.namenatlas.Location;
import ch.unibe.germanistik.namenatlas.datapreparation.Locations.Municipality;
import ch.unibe.germanistik.namenatlas.datapreparation.PlacesOfOrigin.PlaceOfOriginWithLocation;
import ch.unibe.germanistik.namenatlas.datapreparation.TypesTokensBFS.RawBFSData;

/**
 * <h2>Mapping information for the locations derived from {@code reportingmunicipalityId}
 * in the data provided by <a href="../apidocs/ch/unibe/germanistik/namenatlas/DataProvider.html#BFS">Swiss
 * Federal Statistics Office</a></h2>
 *
 * <p>
 * {@link LocationsForBFSResidence#main(java.lang.String[])} writes the collected data to
 * a CSV file.
 * </p>
 */
public class LocationsForBFSResidence {

    final Map<Integer, LocationForBFSResidence> locationsByBFSKey;

    private LocationsForBFSResidence(Stream<LocationForBFSResidence> data) {
        this.locationsByBFSKey = Collections.unmodifiableMap(
            data.collect(Collectors.toMap(
                entry -> entry.municipalityID,
                Function.identity(),
                (v1, v2) -> v1,
                LinkedHashMap::new
            ))
        );
    }

    public @Nullable LocationForBFSResidence find(RawBFSData entry) {
        return locationsByBFSKey.get(entry.reportingMunicipalityId);
    }

    /**
     * Manual overrides for {@link LocationsForBFSResidence#find(RawBFSData)}.
     */
    public static class LocationOverride {
        @CsvBindByName(column = "BFS:REPORTINGMUNICIPALITYID") public final int reportingMunicipalityId;
        @CsvBindByName(column = "LOC:NAME") public final String locationName;
        @CsvBindByName(column = "COMMENT") public final @Nullable String comment;
        public LocationOverride() {
            this.reportingMunicipalityId = 0;
            this.locationName = "";
            this.comment = null;
        }
    }


    /**
     * Mapping match types.
     */
    public enum MatchType {
        /** Location has been assigned manually in {@code bfs-municipality.override.csv} */
        MANUAL,

        /**
         * There is only one location in {@code locations.csv} with a {@code MUNICIPALITY}
         * column matching the name of the municipality with this ID
         */
        UNIQUE,

        /**
         * There is a unique location in {@code locations.csv} with a {@code MUNICIPALITY}
         * column matching the name of the municipality with this ID and a {@code NAME}
         * column that either matches the value of the {@code MUNICIPALITY} column directly
         * or after removing parentheses around a canton abbreviation appended
         * to the municipality name (example for this case: "Benken ZH" matches "Benken (ZH)")
         */
        SAME_NAME,

        /**
         * There is a unique entry in {@code locations-for-place-of-origin.csv}
         * with a {@code NS1:PLACEOFORIGINNAME} matching the name for the municipality,
         * and {@code NS1:CANTONABBREVIATION} matching the {@code REPORTINGCANTONABBR}
         * column.
         */
        PLACE_OF_ORIGIN_NAME,

        /**
         * No match was found for {@code REPORTINGMUNICIPALITYID} in
         * {@code be-t-00.04-agv-01.csv}, but there was a unique
         * match in {@code eCH-0135_Code_Heimatorte.csv}, and the
         * canton of this matching entry is the same as in
         * {@code REPORTINGCANTONABBR}.
         */
        PLACE_OF_ORIGIN_ID,

        /** Fallback if no other match type applies */
        UNKNOWN
    }

    /** Location mapping information */
    public static class LocationForBFSResidence {
        @CsvBindByName(column = "INFO")
        public final MatchType info;

        @CsvBindByName(column = "BFS:REPORTINGMUNICIPALITYID")
        public final int municipalityID;

        @CsvBindByName(column = "LOC:NAME")
        public final String locationName;

        @CsvBindByName(column = "COMMENT")
        public final @Nullable String comment;

        /** Needed for OpenCSV, should not be used anywhere else */
        public LocationForBFSResidence() {
            this.info = MatchType.UNKNOWN;
            this.locationName = "";
            this.comment = null;
            this.municipalityID = 0;
        }



        public LocationForBFSResidence(
            MatchType info,
            int municipalityID,
            String locationName,
            @Nullable String comment
        ) {
            this.info = info;
            this.municipalityID = municipalityID;
            this.locationName = locationName;
            this.comment = comment;
        }



        @Override
        public int hashCode() {
            return Objects.hash(comment, info, locationName, municipalityID);
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
            LocationForBFSResidence other = (LocationForBFSResidence) obj;
            return Objects.equals(comment, other.comment) && info == other.info
                    && Objects.equals(locationName, other.locationName) && municipalityID == other.municipalityID;
        }

        @Override
        public String toString() {
            return "LocationForBFSResidence [comment=" + comment + ", info=" + info + ", locationName=" + locationName
                    + ", municipalityID=" + municipalityID + "]";
        }
    }

    public static LocationsForBFSResidence readFromIntermediateData() {
        Stream<LocationForBFSResidence> data = CSVUtils.readCSV(
            "intermediate/locations-for-municipality.bfs.csv",
            LocationForBFSResidence.class,
            ','
        );
        return new LocationsForBFSResidence(data);
    }

    public static LocationsForBFSResidence readFromRawData() throws IllegalStateException, FileNotFoundException {
        @Nullable String filename = System.getProperty("bfs-data.filename");
        if (filename == null || filename.isBlank()) {
            throw new IllegalStateException("System property 'bfs-data.filename' is either empty or not defined");
        }

        final Map<Integer,LocationOverride> overrides = CSVUtils
            .readRawDataCSV("bfs-municipality.override.csv", LocationOverride.class)
            .collect(Collectors.toUnmodifiableMap(
                entry -> entry.reportingMunicipalityId,
                Function.identity())
            );
        final Map<String,Integer> municipalityIdByName = CSVUtils
            .readRawDataCSV("be-t-00.04-agv-01.csv", Municipality.class)
            .collect(Collectors.toUnmodifiableMap(
                entry -> entry.name,
                entry -> entry.id)
            );
        Locations locations = Locations.readFromRawData();
        final Map<Integer,Set<Location>> locationsByMunicipalityId = new HashMap<>();
        locations.all().forEach(loc -> {
            @Nullable Integer municipalityId = municipalityIdByName.get(loc.getMunicipality());
            if (municipalityId != null) {
                @Nullable Set<Location> locs = locationsByMunicipalityId.get(municipalityId);
                if (locs == null) {
                    locs = new HashSet<>();
                    locationsByMunicipalityId.put(municipalityId, locs);
                }
                locs.add(loc);
            }
        });
        final PlacesOfOrigin placesOfOrigin = PlacesOfOrigin.readFromRawData();

        Iterable<RawBFSData> rawData = CSVUtils.csvReaderForFilename(filename, RawBFSData.class, ';');
        Spliterator<RawBFSData> spliterator = Spliterators.spliteratorUnknownSize(rawData.iterator(), Spliterator.IMMUTABLE);
        final Set<Integer> alreadySeen = new HashSet<>();
        Stream<LocationForBFSResidence> data = StreamSupport.stream(spliterator, false)
            .filter(entry -> alreadySeen.add(entry.reportingMunicipalityId))
            .map(raw -> {
                    @Nullable LocationOverride override = overrides.get(raw.reportingMunicipalityId);
                    if (override != null) {
                        return new LocationForBFSResidence(
                            MatchType.MANUAL,
                            raw.reportingMunicipalityId,
                            override.locationName,
                            override.comment
                        );
                    }

                    @Nullable Set<Location> locs = locationsByMunicipalityId.get(raw.reportingMunicipalityId);
                    if (locs == null) {
                        @Nullable PlaceOfOriginWithLocation placeOfOrigin =
                            placesOfOrigin.dataForPlaceOfOriginByID(raw.reportingMunicipalityId);
                        if (placeOfOrigin != null && placeOfOrigin.placeOfOriginCanton.equals(raw.reportingMunicipalityCanton)) {
                            return new LocationForBFSResidence(
                                MatchType.PLACE_OF_ORIGIN_ID,
                                raw.reportingMunicipalityId,
                                placeOfOrigin.location,
                                placeOfOrigin.comment
                            );
                        } else {
                            return new LocationForBFSResidence(
                                MatchType.UNKNOWN, raw.reportingMunicipalityId, "",
                                "reportingmunicipalityId not found in be-t-00.04-agv-01.csv"
                            );
                        }
                    }

                    if (locs.size() == 1) {
                        Location loc = locs.iterator().next();
                        return new LocationForBFSResidence(
                            MatchType.UNIQUE,
                            raw.reportingMunicipalityId,
                            loc.getName(),
                            null
                        );
                    }

                    String normalizedMunicipality = locs
                        .iterator()
                        .next()
                        .getMunicipality()
                        .replaceFirst("\\((..)\\)$", "$1");
                    for (Location loc : locs) {
                        if (loc.getName().equals(normalizedMunicipality)) {
                            return new LocationForBFSResidence(
                                MatchType.SAME_NAME,
                                raw.reportingMunicipalityId,
                                loc.getName(),
                                null
                            );
                        }
                    }

                    @Nullable Location loc = placesOfOrigin
                        .locationForPlaceOfOriginNameAndCanton(
                            normalizedMunicipality,
                            raw.reportingMunicipalityCanton
                    );
                    if (loc != null) {
                        return new LocationForBFSResidence(
                            MatchType.PLACE_OF_ORIGIN_NAME,
                            raw.reportingMunicipalityId,
                            loc.getName(),
                            null
                        );
                    }

                    // ... before finally admitting that we can't find a location
                    return new LocationForBFSResidence(
                        MatchType.UNKNOWN,
                        raw.reportingMunicipalityId,
                        "",
                        "municipality from be-t-00.04-agv-01.csv: " + locs.iterator().next().getMunicipality()
                        + ", possible locations: " + locs.stream().map(l -> l.getName()).collect(Collectors.joining(", ")));
                }
            );
        return new LocationsForBFSResidence(data);
    }

    /**
     * Generates a CSV file with mapping information from {@code originName1}
     * and {@code placeOfOriginId1} in the BFS data to {@link Location} names.
     *
     * <p>
     * Source data is expected to exist in a file with a file name determined by the system property <code>bfs-data.filename</code>.
     * </p>
     *
     * @param argv the path to the generated CSV file is expected in
     *             <code>argv[0]</code>. Any additional parameters are ignored.
     */
    public static void main(String[] argv) throws IOException, CsvException {
        LocationsForBFSResidence data = LocationsForBFSResidence.readFromRawData();
        CSVUtils.writeCSV(argv[0], LocationForBFSResidence.class, data.locationsByBFSKey.values().stream(),
            "INFO", "BFS:REPORTINGMUNICIPALITYID", "LOC:NAME", "COMMENT"
        );
    }
}
