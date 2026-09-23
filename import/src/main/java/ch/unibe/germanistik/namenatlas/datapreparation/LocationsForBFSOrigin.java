/* (C) 2022 Tivano Software GmbH */
package ch.unibe.germanistik.namenatlas.datapreparation;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;
import java.util.Spliterator;
import java.util.Spliterators;
import java.util.function.Function;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import java.util.stream.StreamSupport;

import org.checkerframework.checker.nullness.qual.Nullable;
import org.checkerframework.checker.nullness.util.NullnessUtil;

import com.opencsv.bean.CsvBindByName;
import com.opencsv.exceptions.CsvException;

import ch.unibe.germanistik.namenatlas.ImmutableLocation;
import ch.unibe.germanistik.namenatlas.Location;
import ch.unibe.germanistik.namenatlas.datapreparation.LocationsForBFSOrigin.LocationForBFSOrigin.Key;
import ch.unibe.germanistik.namenatlas.datapreparation.PlacesOfOrigin.PlaceOfOrigin;
import ch.unibe.germanistik.namenatlas.datapreparation.PlacesOfOrigin.PlaceOfOriginWithLocation;
import ch.unibe.germanistik.namenatlas.datapreparation.TypesTokensBFS.RawBFSData;

/**
 * <h2>Mapping information for the locations derived from {@code originName1}
 * and {@code placeOfOriginId1} in the data provided by
 * <a href="../apidocs/ch/unibe/germanistik/namenatlas/DataProvider.html#BFS">Swiss
 * Federal Statistics Office</a></h2>
 *
 * <p>
 * {@link LocationsForBFSOrigin#main(java.lang.String[])} writes the collected data to
 * a CSV file.
 * </p>
 */
public class LocationsForBFSOrigin {

    final Map<LocationForBFSOrigin.Key, LocationForBFSOrigin> locationsByBFSKey;

    private LocationsForBFSOrigin(Stream<LocationForBFSOrigin> data) {
        this.locationsByBFSKey = Collections.unmodifiableMap(
            data.collect(Collectors.toMap(
                loc -> loc.key(),
                Function.identity(),
                (v1, v2) -> v1,
                LinkedHashMap::new
            ))
        );
    }

    public @Nullable LocationForBFSOrigin find(RawBFSData entry) {
        LocationForBFSOrigin.Key key = new LocationForBFSOrigin.Key(entry);
        return locationsByBFSKey.get(key);
    }

    /**
     * Manual overrides for {@link LocationsForBFSOrigin#find(RawBFSData)}.
     */
    public static class LocationByOriginOverride {
        @CsvBindByName(column = "BFS:ORIGINNAME1") public final String bfsOriginName;
        @CsvBindByName(column = "BFS:PLACEOFORIGINID1") public final int bfsOriginID;
        @CsvBindByName(column = "NS1:PLACEOFORIGINNAME") public final String placeOfOriginName;
        @CsvBindByName(column = "NS1:PLACEOFORIGINID") public final int placeOfOriginID;
        @CsvBindByName(column = "COMMENT") public final String comment;
        public LocationByOriginOverride() {
            bfsOriginName = placeOfOriginName = comment = "";
            bfsOriginID = placeOfOriginID = 0;
        }
        LocationForBFSOrigin.Key key() {
            return new LocationForBFSOrigin.Key(bfsOriginName, Integer.toString(bfsOriginID));
        }
    }


    /**
     * Mapping match types.
     */
    public enum MatchType {
        /** Location has been assigned manually in {@code hls-origin.override.csv} */
        MANUAL,

        /**
         * There is an entry in {@code locations-for-place-of-origin.csv}
         * with matching ID and name.
         */
        FULL_MATCH,

        /**
         * There is an entry in {@code locations-for-place-of-origin.csv}
         * with matching ID and name after removing the parentheses around the
         * canton ID in {@code originName1}.
         */
        FUZZY_CANTON_SUFFIX_MATCH,

        /**
         * There is an entry in {@code locations-for-place-of-origin.csv}
         * with matching ID and name after removing the canton ID
         * from {@code originName1}.
         */
        FULL_MATCH_WITHOUT_CANTON_SUFFIX,

        /**
         * The value in {@code originName1} matches the regexp "[0-9]* .*" and there
         * is an entry in {@code locations-for-place-of-origin.csv}
         * with matching ID and name after removing the numeric prefix from
         * from {@code originName1}.
         */
        SUFFIX_MATCH,

        /**
         * There is an entry in {@code locations-for-place-of-origin.csv} with the same
         * name, and the ID of the {@linkplain PlacesOfOrigin#finalSuccessor(PlaceOfOrigin) final successor}
         * of this entry matches the value in {@code placeOfOriginId1}.
         */
        SUCCESSOR_MATCH,

        /**
         * There is an entry in {@code locations-for-place-of-origin.csv} where the name
         * matches after removing parentheses around the canton ID in {@code originName1},
         * and the ID of the {@linkplain PlacesOfOrigin#finalSuccessor(PlaceOfOrigin) final successor}
         * of this entry matches the value in {@code placeOfOriginId1}.
         */
        SUCCESSOR_MATCH_FUZZY_CANTON_SUFFIX,

        /**
         * There is an entry in {@code locations-for-place-of-origin.csv} where the name
         * matches after removing the canton ID suffix in {@code originName1},
         * and the ID of the {@linkplain PlacesOfOrigin#finalSuccessor(PlaceOfOrigin) final successor}
         * of this entry matches the value in {@code placeOfOriginId1}.
         */
        SUCCESSOR_MATCH_WITHOUT_CANTON_SUFFIX,

        /**
         * The value in {@code originName1} matches the regexp "[0-9]+ .*" and there
         * is an entry in {@code locations-for-place-of-origin.csv} where the name
         * matches after removing the numeric prefix from {@code originName1},
         * and the ID of the {@linkplain PlacesOfOrigin#finalSuccessor(PlaceOfOrigin) final successor}
         * of this entry matches the value in {@code placeOfOriginId1}.
         */
        SUCCESSOR_SUFFIX_MATCH,

        /**
         * There is a unique entry in {@code locations-for-place-of-origin.csv} whose ID matches
         * {@code placeOfOriginId1}.
         */
        UNIQUE_ID_MATCH,

        /** Fallback if no other match type applies */
        UNKNOWN
    }

    /** Location mapping information */
    public static class LocationForBFSOrigin {
        @CsvBindByName(column = "INFO")
        public final MatchType info;

        @CsvBindByName(column = "BFS:ORIGINNAME1")
        public final String bfsOriginName;
        @CsvBindByName(column = "BFS:PLACEOFORIGINID1")
        public final String bfsOriginID;

        @CsvBindByName(column = "NS1:PLACEOFORIGINNAME")
        public final String eCH0135OriginName;
        @CsvBindByName(column = "NS1:PLACEOFORIGINID")
        public final String eCH0135OriginID;
        @CsvBindByName(column = "NS1:CANTONABBREVIATION")
        public final String eCH0135Canton;

        @CsvBindByName(column = "LOC:NAME")
        public final String locationName;
        @CsvBindByName(column = "LOC:CANTON")
        public final String locationCanton;

        @CsvBindByName(column = "COMMENT")
        public final @Nullable String comment;

        /** Needed for OpenCSV, should not be used anywhere else */
        public LocationForBFSOrigin() {
            this.info = MatchType.UNKNOWN;
            this.bfsOriginName = "";
            this.bfsOriginID = "";
            this.eCH0135OriginName = "";
            this.eCH0135OriginID = "";
            this.eCH0135Canton = "";
            this.locationName = "";
            this.locationCanton = "";
            this.comment = null;
        }

        public static class Key {
            private final String key;
            public Key(RawBFSData data) {
                this(data.placeOfOriginName, Integer.toString(data.placeOfOriginId));
            }

            private Key(String name, String id) {
                this.key = name + ":" + id;
            }

            @Override
            public int hashCode() {
                return Objects.hash(key);
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
                Key other = (Key) obj;
                return Objects.equals(key, other.key);
            }
            @Override
            public String toString() {
                return "Key [key=" + key + "]";
            }
        }

        public Key key() { return new Key(this.bfsOriginName, this.bfsOriginID); }

        private LocationForBFSOrigin(MatchType info, RawBFSData bfs, PlaceOfOriginWithLocation loc, @Nullable String comment) {
            this.info = info;
            this.bfsOriginName = bfs.placeOfOriginName;
            this.bfsOriginID = Integer.toString(bfs.placeOfOriginId);
            this.eCH0135OriginName = loc.placeOfOriginName;
            this.eCH0135OriginID = Integer.toString(loc.placeOfOriginID);
            this.eCH0135Canton = loc.placeOfOriginCanton;
            this.locationName = loc.location;
            this.locationCanton = loc.locationCanton;
            this.comment = comment;
        }
        private LocationForBFSOrigin(MatchType info, RawBFSData bfs, Location loc, @Nullable String comment) {
            this.info = info;
            this.bfsOriginName = bfs.placeOfOriginName;
            this.bfsOriginID = Integer.toString(bfs.placeOfOriginId);
            this.eCH0135OriginName = "";
            this.eCH0135OriginID = "";
            this.eCH0135Canton = "";
            this.locationName = loc.getName();
            this.locationCanton = loc.getCanton();
            this.comment = comment;
        }
        @Override
        public int hashCode() {
            return Objects.hash(bfsOriginID, bfsOriginName, comment, eCH0135Canton, eCH0135OriginID, eCH0135OriginName,
                    info, locationCanton, locationName);
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
            LocationForBFSOrigin other = (LocationForBFSOrigin) obj;
            return Objects.equals(bfsOriginID, other.bfsOriginID) && Objects.equals(bfsOriginName, other.bfsOriginName)
                    && Objects.equals(comment, other.comment) && Objects.equals(eCH0135Canton, other.eCH0135Canton)
                    && Objects.equals(eCH0135OriginID, other.eCH0135OriginID)
                    && Objects.equals(eCH0135OriginName, other.eCH0135OriginName) && info == other.info
                    && Objects.equals(locationName, other.locationName);
        }
        @Override
        public String toString() {
            return "LocationForBFSOrigin [bfsOriginID=" + bfsOriginID + ", bfsOriginName=" + bfsOriginName
                    + ", comment=" + comment + ", eCH0135Canton=" + eCH0135Canton + ", eCH0135OriginID="
                    + eCH0135OriginID + ", eCH0135OriginName=" + eCH0135OriginName + ", info=" + info
                    + ", locationCanton=" + locationCanton + ", locationName=" + locationName + "]";
        }


    }

    public static LocationsForBFSOrigin readFromIntermediateData() {
        Stream<LocationForBFSOrigin> data = CSVUtils.readCSV(
            "intermediate/locations-for-origin.bfs.csv",
            LocationForBFSOrigin.class,
            ','
        );
        return new LocationsForBFSOrigin(data);
    }

    public static LocationsForBFSOrigin readFromRawData() throws IllegalStateException, FileNotFoundException {
        @Nullable String filename = System.getProperty("bfs-data.filename");
        if (filename == null || filename.isBlank()) {
            throw new IllegalStateException("System property 'bfs-data.filename' is either empty or not defined");
        }

        final Map<Key,LocationByOriginOverride> overrides = CSVUtils
            .readRawDataCSV("bfs-origin.override.csv", LocationByOriginOverride.class)
            .collect(Collectors.toUnmodifiableMap(
                entry -> entry.key(),
                Function.identity())
            );
        final PlacesOfOrigin placesOfOrigin = PlacesOfOrigin.readFromRawData();
        final Location UNKOWN_LOCATION = ImmutableLocation.builder()
            .withId(0)
            .withName("")
            .withMunicipality("")
            .withDistrict("")
            .withCanton("")
            .withCountry("")
            .build();
        final Pattern NUMERIC_PREFIX_RE = Pattern.compile("^[0-9][0-9]*  *(.*)$");

        Iterable<RawBFSData> rawData = CSVUtils.csvReaderForFilename(filename, RawBFSData.class, ';');
        Spliterator<RawBFSData> spliterator = Spliterators.spliteratorUnknownSize(rawData.iterator(), Spliterator.IMMUTABLE);
        Stream<LocationForBFSOrigin> data = StreamSupport.stream(spliterator, false)
            .filter(RawBFSData::hasValidPlaceOfOrigin)
            .map( raw -> {
                    @Nullable PlaceOfOriginWithLocation origin = null;
                    String name = raw.placeOfOriginName;
                    int id = raw.placeOfOriginId;

                    @Nullable LocationByOriginOverride override = overrides.get(new Key(raw));
                    if (override != null) {
                        origin = placesOfOrigin.dataForPlaceOfOriginNameAndID(
                            override.placeOfOriginName,
                            override.placeOfOriginID
                        );
                        if (origin != null) {
                            return new LocationForBFSOrigin(
                                MatchType.MANUAL,
                                raw,
                                origin,
                                override.comment
                            );
                        } else {
                            return new LocationForBFSOrigin(MatchType.MANUAL, raw, UNKOWN_LOCATION, null);
                        }
                    }

                    // Try with name and ID first ...
                    origin = placesOfOrigin.dataForPlaceOfOriginNameAndID(name, id);
                    if (origin != null) {
                        return new LocationForBFSOrigin(MatchType.FULL_MATCH, raw, origin, null);
                    }

                    // ... then try with fuzzy canton and ID and wothout canton suffix ...
                    Matcher fuzzyCanton = PlacesOfOrigin.PLACENAME_WITH_CANTON_IN_PARENTHESES_REGEXP.matcher(name);
                    if (fuzzyCanton.matches()) {
                        String fuzzyName = fuzzyCanton.group(1) + " " + fuzzyCanton.group(2);
                        origin = placesOfOrigin.dataForPlaceOfOriginNameAndID(fuzzyName, id);
                        if (origin != null) {
                            return new LocationForBFSOrigin(
                                MatchType.FUZZY_CANTON_SUFFIX_MATCH,
                                raw, origin, null
                            );
                        }
                        fuzzyName = NullnessUtil.castNonNull(fuzzyCanton.group(1)); // Guaranteed by the regexp match
                        origin = placesOfOrigin.dataForPlaceOfOriginNameAndID(fuzzyName, id);
                        if (origin != null) {
                            return new LocationForBFSOrigin(
                                MatchType.FULL_MATCH_WITHOUT_CANTON_SUFFIX,
                                raw, origin, null
                            );
                        }
                    }

                    // ... and with numeric prefix (if applicable) ...
                    Matcher numPrefix = NUMERIC_PREFIX_RE.matcher(name);
                    if (numPrefix.matches()) {
                        String suffix = NullnessUtil.castNonNull(numPrefix.group(1)); // Guaranteed by the regexp match;
                        origin = placesOfOrigin.dataForPlaceOfOriginNameAndID(suffix, id);
                        if (origin != null) {
                            return new LocationForBFSOrigin(
                                MatchType.SUFFIX_MATCH,
                                raw, origin, null
                            );
                        }
                    }

                    // ... next try is with sucessor id ...
                    origin = placesOfOrigin.dataForPlaceOfOriginNameAndFinalSuccessorID(name, id);
                    if (origin != null) {
                        return new LocationForBFSOrigin(MatchType.SUCCESSOR_MATCH, raw, origin, null);
                    }

                    // ... and with successor id and fuzzy canton ...
                    if (fuzzyCanton.matches()) {
                        String fuzzyName = fuzzyCanton.group(1) + " " + fuzzyCanton.group(2);
                        origin = placesOfOrigin.dataForPlaceOfOriginNameAndFinalSuccessorID(fuzzyName, id);
                        if (origin != null) {
                            return new LocationForBFSOrigin(
                                MatchType.SUCCESSOR_MATCH_FUZZY_CANTON_SUFFIX,
                                raw, origin, null
                            );
                        }
                        fuzzyName = NullnessUtil.castNonNull(fuzzyCanton.group(1)); // Guaranteed by the regexp match
                        origin = placesOfOrigin.dataForPlaceOfOriginNameAndFinalSuccessorID(fuzzyName, id);
                        if (origin != null) {
                            return new LocationForBFSOrigin(
                                MatchType.SUCCESSOR_MATCH_WITHOUT_CANTON_SUFFIX,
                                raw, origin, null
                            );
                        }
                    }

                    // ... and with successor id and numeric prefix (if applicable) ...
                    if (numPrefix.matches()) {
                        String suffix = NullnessUtil.castNonNull(numPrefix.group(1)); // Guaranteed by the regexp match;
                        origin = placesOfOrigin.dataForPlaceOfOriginNameAndFinalSuccessorID(suffix, id);
                        if (origin != null) {
                            return new LocationForBFSOrigin(
                                MatchType.SUCCESSOR_SUFFIX_MATCH,
                                raw, origin, null
                            );
                        }
                    }

                    // ... last resort is unique id ...
                    origin = placesOfOrigin.dataForPlaceOfOriginByID(id);
                    if (origin != null) {
                        return new LocationForBFSOrigin(MatchType.UNIQUE_ID_MATCH, raw, origin, null );
                    }

                    // ... before finally admitting that we can't find a location
                    return new LocationForBFSOrigin(MatchType.UNKNOWN, raw, UNKOWN_LOCATION, null);
                }
            )
            .distinct();
        return new LocationsForBFSOrigin(data);
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
        LocationsForBFSOrigin data = LocationsForBFSOrigin.readFromRawData();
        CSVUtils.writeCSV(argv[0], LocationForBFSOrigin.class, data.locationsByBFSKey.values().stream(),
            "INFO",
            "BFS:ORIGINNAME1", "BFS:PLACEOFORIGINID1",
            "NS1:PLACEOFORIGINNAME", "NS1:PLACEOFORIGINID","NS1:CANTONABBREVIATION",
            "LOC:NAME", "LOC:CANTON",
            "COMMENT"
        );
    }
}
