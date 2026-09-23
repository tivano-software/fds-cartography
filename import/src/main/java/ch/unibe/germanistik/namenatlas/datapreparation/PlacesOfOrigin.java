/* (C) 2021 Tivano Software GmbH */
package ch.unibe.germanistik.namenatlas.datapreparation;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Function;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import com.opencsv.bean.CsvBindByName;
import com.opencsv.bean.CsvDate;
import com.opencsv.exceptions.CsvException;

import org.checkerframework.checker.index.qual.Positive;
import org.checkerframework.checker.nullness.qual.Nullable;
import org.checkerframework.checker.nullness.util.NullnessUtil;
import org.checkerframework.dataflow.qual.Pure;

import ch.unibe.germanistik.namenatlas.Location;
import ch.unibe.germanistik.namenatlas.datapreparation.PlacesOfOrigin.PlaceOfOriginWithLocation.MappingInfo;

/**
 * <h2>Import {@link PlaceOfOrigin} data and map each place of origin to a {@link Location}.</h2>
 *
 * <p>
 * Constructs {@link PlaceOfOrigin} entries from the raw data
 * in <code>eCH-0135_Code_Heimatorte.csv</code>, and maps that data
 * to a {@link Location} according to the following rules:
 * </p>
 *
 * <ul>
 *   <li>
 *     If an entry for {@link PlaceOfOrigin#placeOfOriginName} and {@link PlaceOfOrigin#placeOfOriginID} exists
 *     in the file <code>place-of-origin.override.csv</code>, the location is assigned according to this override
 *     definition.
 *   </li>
 *   <li>
 *     Otherwise, if {@link PlaceOfOrigin#placeOfOriginName} or {@link PlaceOfOrigin#placeOfOriginName} with
 *     appended {@link PlaceOfOrigin#placeOfOriginCanton} exactly matches the "Ortschaftsname" column of an entry in
 *     <code>PLZO_CSV_LV95.csv</code>, the corresponding {@link Location} entry is assigned.
 *   </li>
 *   <li>
 *     Otherwise, if a suffix of {@link PlaceOfOrigin#placeOfOriginName} (with or without
 *     appended {@link PlaceOfOrigin#placeOfOriginCanton}) matches the the "Ortschaftsname" column of an entry in
 *     <code>PLZO_CSV_LV95.csv</code>, the corresponding {@link Location} entry is assigned.
 *   </li>
 *   <li>
 *     Otherwise, if {@link PlaceOfOrigin#successorID} is not <code>null</code>, lookup starts again with the entry
 *     that has the successor ID as {@link PlaceOfOrigin#placeOfOriginID}. For the special case where
 *     {@link PlaceOfOrigin#successorID} and {@link PlaceOfOrigin#placeOfOriginID} are identical
 *     (example: The entries with <em>placeOfOriginName</em> "Blauen"), the (unique) entry that has no successor ID
 *     is used to continue with the lookup.
 *   </li>
 *   <li>
 *     In all other cases, location assignment fails.
 *   </li>
 * </ul>
 *
 * <p>
 * {@link PlacesOfOrigin#main(java.lang.String[])} writes the converted data
 * to a CSV file. The file name is passed in as the first parameter.
 * Each entry in this file consists of the data from <code>eCH-0135_Code_Heimatorte.csv</code>,
 * the information about how this entry was mapped to a {@link Location}, and the (unique) {@link Location#getName()} of this
 * {@link Location}. The main purpose of this file is for documentation and manual verification of the "place of origin" to
 * location mapping.
 * </p>
 */
public class PlacesOfOrigin {

    public static Pattern PLACENAME_WITH_CANTON_REGEXP = Pattern.compile("^(.*) (ZH|BE|LU|UR|SZ|OW|NW|GL|ZG|FR|SO|BS|BL|SH|AR|AI|SG|GR|AG|TG|TI|VD|VS|NE|GE|JU)");
    public static Pattern PLACENAME_WITH_CANTON_IN_PARENTHESES_REGEXP = Pattern.compile("^(.*) \\((ZH|BE|LU|UR|SZ|OW|NW|GL|ZG|FR|SO|BS|BL|SH|AR|AI|SG|GR|AG|TG|TI|VD|VS|NE|GE|JU)\\)");

    /**
     * Raw place of origin data as read from <code>eCH-0135_Code_Heimatorte.csv</code>.
     */
    public static class PlaceOfOrigin {
        /**
         * "Place of Origin" ID as defined in <code>eCH-0135_Code_Heimatorte.csv</code>.
         * Note that this is not unique, because <code>eCH-0135_Code_Heimatorte.csv</code>
         * may also contain superseded entries with the same ID. But there should only be
         * one non-superseded entry for every ID.
         */
        @CsvBindByName(column = "ns1:placeOfOriginId")
        public final @Positive int placeOfOriginID;

        @CsvBindByName(column = "ns1:placeOfOriginName")
        public final String placeOfOriginName;

        @CsvBindByName(column = "ns1:cantonAbbreviation")
        public final String placeOfOriginCanton;

        /**
         * Mapping to a {@link Location} by means of the "historyMunicipalityId" as defined by BFS.
         * Optional in <code>eCH-0135_Code_Heimatorte.csv</code>, so not defined for all entries.
         */
        @CsvBindByName(column = "ns1:historyMunicipalityId")
        public final @Nullable @Positive Integer historyMunicipalityID;

        /**
         * For entries in <code>eCH-0135_Code_Heimatorte.csv</code> that have been superseded by
         * newer entries (e.g. because of name changes or fusions), this is the
         * {@link #placeOfOriginID} of the  superseding entry.
         * For non-superseded entries, this is <code>null</code>.
         */
        @CsvBindByName(column = "ns1:successorId")
        public final @Nullable @Positive Integer successorID;

        @CsvBindByName(column = "ns1:validTo")
        @CsvDate(value = "dd.MM.yyyy")
        public final @Nullable Date validTo;

        @CsvBindByName(column = "ns1:validFrom")
        @CsvDate(value = "dd.MM.yyyy")
        public final @Nullable Date validFrom;

        /** Needed by OpenCSV, should not be used anywhere else. */
        public PlaceOfOrigin() { this(0, "", "", null, null, null, null); }

        public PlaceOfOrigin(@Positive int placeOfOriginID, String placeOfOriginName, String canton,
                @Nullable @Positive Integer historyMunicipalityID, @Nullable @Positive Integer successorID,
                @Nullable Date validFrom, @Nullable Date validTo) {
            this.placeOfOriginID = placeOfOriginID;
            this.placeOfOriginName = placeOfOriginName;
            this.placeOfOriginCanton = canton;
            this.historyMunicipalityID = historyMunicipalityID;
            this.successorID = successorID;
            this.validFrom = validFrom;
            this.validTo = validTo;
        }

        public final String key() {
            return placeOfOriginName + ":" + placeOfOriginID;
        }

        @Override
        public int hashCode() {
            return Objects.hash(placeOfOriginCanton, historyMunicipalityID, placeOfOriginID, placeOfOriginName, successorID,
                    validFrom, validTo);
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
            PlaceOfOrigin other = (PlaceOfOrigin) obj;
            return Objects.equals(placeOfOriginCanton, other.placeOfOriginCanton)
                    && Objects.equals(historyMunicipalityID, other.historyMunicipalityID)
                    && placeOfOriginID == other.placeOfOriginID
                    && Objects.equals(placeOfOriginName, other.placeOfOriginName)
                    && Objects.equals(successorID, other.successorID) && Objects.equals(validFrom, other.validFrom)
                    && Objects.equals(validTo, other.validTo);
        }

        @Override
        public String toString() {
            return "PlaceOfOrigin [canton=" + placeOfOriginCanton + ", historyMunicipalityID=" + historyMunicipalityID
                    + ", placeOfOriginID=" + placeOfOriginID + ", placeOfOriginName=" + placeOfOriginName
                    + ", successorID=" + successorID + ", validFrom=" + validFrom + ", validTo=" + validTo + "]";
        }

    }

    /**
     * {@link PlaceOfOrigin} with associated {@link Location} and {@link MappingInfo}.
     */
    public static class PlaceOfOriginWithLocation extends PlaceOfOrigin {
        public enum MappingInfo {
            MANUAL, SUCCESSOR, NAME, NAME_SUFFIX, NAME_PREFIX
        }


        @CsvBindByName(column = "LOC:INFO")   public final MappingInfo mappingInfo;
        @CsvBindByName(column = "LOC:NAME")   public final String location;
        @CsvBindByName(column = "LOC:CANTON") public final String locationCanton;
        @CsvBindByName(column = "COMMENT")    public final String comment;


        public PlaceOfOriginWithLocation(@Positive int placeOfOriginID, String placeOfOriginName, String placeOfOriginCanton,
                @Nullable @Positive Integer historyMunicipalityID, @Nullable @Positive Integer successorID,
                @Nullable Date validFrom, @Nullable Date validTo, String locationName,
                String locationCanton, MappingInfo mappingInfo, String comment) {
            super(placeOfOriginID, placeOfOriginName, placeOfOriginCanton, historyMunicipalityID, successorID, validFrom, validTo);
            this.mappingInfo = mappingInfo;
            this.location = locationName;
            this.locationCanton = locationCanton;
            this.comment = comment;
        }

        public PlaceOfOriginWithLocation(PlaceOfOrigin raw, String locationName, String locationCanton, MappingInfo mappingInfo, String comment) {
            this(raw.placeOfOriginID, raw.placeOfOriginName, raw.placeOfOriginCanton, raw.historyMunicipalityID, raw.successorID, raw.validFrom, raw.validTo,
                locationName, locationCanton, mappingInfo, comment);
        }

        public PlaceOfOriginWithLocation(PlaceOfOrigin raw, Location location, MappingInfo mappingInfo, String comment) {
            this(raw.placeOfOriginID, raw.placeOfOriginName, raw.placeOfOriginCanton, raw.historyMunicipalityID, raw.successorID, raw.validFrom, raw.validTo,
                location.getName(), location.getCanton(), mappingInfo, comment);
        }

        /** Needed by OpenCSV, should not be used anywhere else. */
        public PlaceOfOriginWithLocation() {
            this(0, "", "", null, null, null, null, "", "", MappingInfo.MANUAL, "");
        }

        @Override
        public int hashCode() {
            final int prime = 31;
            int result = super.hashCode();
            result = prime * result + Objects.hash(locationCanton, comment, location, mappingInfo);
            return result;
        }

        @Override
        public boolean equals(@Nullable Object obj) {
            if (this == obj) {
                return true;
            }
            if (!super.equals(obj)) {
                return false;
            }
            if (getClass() != obj.getClass()) {
                return false;
            }
            PlaceOfOriginWithLocation other = (PlaceOfOriginWithLocation) obj;
            return Objects.equals(locationCanton, other.locationCanton) && Objects.equals(comment, other.comment)
                    && Objects.equals(location, other.location) && mappingInfo == other.mappingInfo;
        }

        @Override
        public String toString() {
            return "PlaceOfOriginWithLocation [placeOfOriginCanton=" + placeOfOriginCanton
                    + ", historyMunicipalityID=" + historyMunicipalityID
                    + ", placeOfOriginID=" + placeOfOriginID
                    + ", placeOfOriginName=" + placeOfOriginName
                    + ", successorID=" + successorID
                    + ", validFrom=" + validFrom
                    + ", validTo=" + validTo
                    + ", comment=" + comment
                    + ", location=" + location
                    + ", locationCanton=" + locationCanton
                    + ", mappingInfo=" + mappingInfo + "]";
        }


    }

    public final Locations locations;
    final Collection<PlaceOfOrigin> rawPlacesOfOrigin; // Not private because LocationsTest needs access.
    final Collection<PlaceOfOriginWithLocation> placesOfOrigin; // Not private because LocationsTest needs access.
    private final Map<Integer,PlaceOfOrigin> validSucessorsByID;
    private final Map<String,PlaceOfOriginWithLocation> locationsByPlaceOfOriginNameAndFinalSuccessorID;
    private final Map<String,PlaceOfOriginWithLocation> locationsByPlaceOfOriginNameAndID;
    private final Map<Integer,PlaceOfOriginWithLocation> locationsByUniquePlaceOfOriginID;
    private final Map<String,Location> locationsByPlaceOfOriginNameAndCanton;

    public PlacesOfOrigin(Locations locations,
        Collection<PlaceOfOriginWithLocation> placeOfOriginLocationOverrides,
        Collection<PlaceOfOrigin> rawPlacesOfOrigin)
    {
        this.locations = locations;
        this.rawPlacesOfOrigin = Collections.unmodifiableCollection(new ArrayList<>(rawPlacesOfOrigin));

        this.validSucessorsByID = Collections.unmodifiableMap(
            rawPlacesOfOrigin.stream()
                // Entries which sucessorID == placeOfOriginID are not valid sucessors,
                // only those that either have no sucessorID or a different sucessorID.
                .filter(entry -> !Objects.equals(entry.placeOfOriginID, entry.successorID))
                .collect(Collectors.toMap(
                        entry -> entry.placeOfOriginID,
                        Function.identity(),
                        (v1, v2) -> v1,
                        LinkedHashMap::new
                    )
                )
        );
        Map<String, PlaceOfOriginWithLocation> locationOverrideByPlaceOfOriginName = placeOfOriginLocationOverrides.stream()
            .collect(Collectors.toMap(
                    PlaceOfOrigin::key,
                    Function.identity(),
                    (v1, v2) -> v1,
                    LinkedHashMap::new
                )
            );
        this.placesOfOrigin = Collections.unmodifiableCollection(rawPlacesOfOrigin.stream()
            .<@Nullable PlaceOfOriginWithLocation>map(entry -> withLocation(
                    entry,
                    locations,
                    locationOverrideByPlaceOfOriginName,
                    validSucessorsByID
                )
            )
            .filter(Objects::nonNull)
            .collect(Collectors.toCollection(LinkedHashSet::new)));

        this.locationsByPlaceOfOriginNameAndID = Collections.unmodifiableMap(placesOfOrigin.stream()
            .filter(entry -> locations.byName(entry.location) != null)
            .collect(Collectors.toMap(
                    entry -> entry.placeOfOriginName + ":" + entry.placeOfOriginID,
                    Function.identity(),
                    (v1, v2) -> v1,
                    LinkedHashMap::new
                )
            )
        );

        this.locationsByPlaceOfOriginNameAndFinalSuccessorID = Collections.unmodifiableMap(placesOfOrigin.stream()
            .filter(entry -> locations.byName(entry.location) != null)
            .collect(Collectors.toMap(
                    entry -> entry.placeOfOriginName + ":" + finalSuccessor(entry, validSucessorsByID).placeOfOriginID,
                    Function.identity(),
                    (v1, v2) -> v1,
                    LinkedHashMap::new
                )
            )
        );
        Map<String,Location> locationsByPlaceOfOriginNameAndCanton = placesOfOrigin.stream()
            .filter(entry -> locations.byName(entry.location) != null)
            .collect(Collectors.toMap(
                    entry -> entry.placeOfOriginName + ":" + entry.placeOfOriginCanton,
                    // Can assume @NonNull result here because of the filter
                    entry -> NullnessUtil.castNonNull(locations.byName(entry.location)),
                    (v1, v2) -> v1,
                    LinkedHashMap::new
                )
            );

        // Allow lookup of foreign locations by name and (empty) canton as well.
        // This is needed by {@link TypesTokensHLS} to map tokens with foreign place of origin
        locations.foreign().forEach(loc -> {
            String key = loc.getName() + ":" + loc.getCanton();
            locationsByPlaceOfOriginNameAndCanton.put(key, loc);
        });

        this.locationsByPlaceOfOriginNameAndCanton = Collections.unmodifiableMap(locationsByPlaceOfOriginNameAndCanton);

        Map<Integer,AtomicInteger> countByPlaceOfOriginID = new LinkedHashMap<>();
        placesOfOrigin.forEach(entry -> {
            @Nullable AtomicInteger count = countByPlaceOfOriginID.get(entry.placeOfOriginID);
            if (count == null) {
                countByPlaceOfOriginID.put(entry.placeOfOriginID, new AtomicInteger(1));
            } else {
                count.incrementAndGet();
            }
        });

        this.locationsByUniquePlaceOfOriginID = Collections.unmodifiableMap(placesOfOrigin.stream()
            .filter(entry -> {
                @Nullable AtomicInteger count = countByPlaceOfOriginID.get(entry.placeOfOriginID);
                assert count != null : "@AssumeAssertion(nullness) - guaranteed because entry.placeOfOriginID is a valid key here";
                return count.get() == 1;
            })
            .filter(entry -> locations.byName(entry.location) != null)
            .collect(Collectors.toMap(
                entry -> entry.placeOfOriginID,
                Function.identity(),
                (v1, v2) -> v1,
                LinkedHashMap::new
            )
        ));
    }

    private static Pattern PREFIX_DASH_SUFFIX = Pattern.compile("^(.*)-(.*)$");
    private static Collection<Pattern> SUFFIX_PATTERNS = Arrays.asList(
        // Special case for prefixes of the form "NAME (CANTON)" with a suffix in parentheses
        Pattern.compile("^(.*? \\(..\\)) \\((.*)\\)$"),
        // Generic "PREFIX (SUFFIX)" pattern
        Pattern.compile("^([^\\(\\)]*) \\((.*)\\)$"),
        // Generic "PREFIX, SUFFIX" pattern
        Pattern.compile("^(.*), (.*)$")
    );
    private static @Nullable PlaceOfOriginWithLocation withLocation(
        PlaceOfOrigin place,
        Locations locations,
        Map<String, PlaceOfOriginWithLocation>  locationOverrideByPlaceOfOriginName,
        Map<Integer, PlaceOfOrigin> placeOfOriginByID)
    {
        // Check override first and use it if found
        @Nullable PlaceOfOriginWithLocation override = locationOverrideByPlaceOfOriginName.get(place.key());
        if (override != null) {
            return override;
        }

        @Nullable Location location = null;

        // Try to find a fine grained location in PLZO_CSV_LV95.csv

        // First, try to directly match via name
        if ((location = locations.byName(place.placeOfOriginName)) != null) {
            return new PlaceOfOriginWithLocation(place, location, MappingInfo.NAME, "");
        }
        // Then try again with canton ID appended. PLZO_CSV_LV95.csv does not
        // use parentheses her, so just append the plain ID
        location = locations.byName(place.placeOfOriginName + " " + place.placeOfOriginCanton);
        if (location != null) {
            return new PlaceOfOriginWithLocation(place, location, MappingInfo.NAME, "");
        }

        // Check if the name can be decomposed in a municipality prefix and fine grained location suffix.
        @Nullable String plzoNameSuffix = null;
        for (Pattern pattern : SUFFIX_PATTERNS) {
            Matcher m = pattern.matcher(place.placeOfOriginName);
            if (m.matches()) {
                plzoNameSuffix = m.group(2);
                break;
            }
        }

        // If we have a PLZO name from the suffix, try to match by it - but accept only
        // matches within the same canton.
        if (plzoNameSuffix != null) {
            // First try a direct match
            location = locations.byName(plzoNameSuffix);
            if (location != null && location.getCanton().equals(place.placeOfOriginCanton)) {
                return new PlaceOfOriginWithLocation(place, location, MappingInfo.NAME_SUFFIX, "");
            }

            // Then try again with canton ID appended.
            location = locations.byName(plzoNameSuffix + " " + place.placeOfOriginCanton);
            if (location != null && location.getCanton().equals(place.placeOfOriginCanton)) {
                return new PlaceOfOriginWithLocation(place, location, MappingInfo.NAME_SUFFIX, "");
            }
        }

        // Try to decompose the name with the generic PREFIX-SUFFIX pattern.
        // Names matching this pattern are often used as the new name for
        // two merged municipalities, with the name of the larger municipality
        // usually as the PREFIX component. To reflect this, we prefer a location
        // with a name matching PREFIX over one matching SUFFIX here.
        Matcher mergedMunicipalityMatcher = PREFIX_DASH_SUFFIX.matcher(place.placeOfOriginName);
        if (mergedMunicipalityMatcher.matches()) {
            @Nullable String prefix = mergedMunicipalityMatcher.group(1);
            assert prefix != null : "@AssumeAssertion(nullness) - guaranteed by the regexp match";
            location = locations.byName(prefix);
            if (location != null && location.getCanton().equals(place.placeOfOriginCanton)) {
                return new PlaceOfOriginWithLocation(place, location, MappingInfo.NAME_PREFIX, "");
            }
            @Nullable String suffix = mergedMunicipalityMatcher.group(2);
            assert suffix != null : "@AssumeAssertion(nullness) - guaranteed by the regexp match";
            location = locations.byName(suffix);
            if (location != null && location.getCanton().equals(place.placeOfOriginCanton)) {
                return new PlaceOfOriginWithLocation(place, location, MappingInfo.NAME_SUFFIX, "");
            }
        }

        // Finally, try to match via sucessorID
        if (place.successorID != null) {
            PlaceOfOrigin successor = immediateSuccessor(place, placeOfOriginByID);
            if (!place.equals(successor)) {
                @Nullable PlaceOfOriginWithLocation mappedSucessor = withLocation(
                    successor,
                    locations,
                    locationOverrideByPlaceOfOriginName,
                    placeOfOriginByID
                );
                if (mappedSucessor != null) {
                    return new PlaceOfOriginWithLocation(
                        place,
                        mappedSucessor.location,
                        mappedSucessor.locationCanton,
                        MappingInfo.SUCCESSOR,
                        "See placeOfOriginID=" + mappedSucessor.placeOfOriginID + "/placeOfOriginName=" + mappedSucessor.placeOfOriginName
                    );
                }
            }
        }

        // Nothing found. Give up.
        // return new PlaceOfOriginWithLocation(place, NullnessUtil.castNonNull(locations.byID(0)), MappingInfo.MANUAL, "");
        return null;
    }

    public static PlacesOfOrigin readFromRawData() {

        Locations locations = Locations.readFromRawData();
        Collection<PlaceOfOrigin> rawPlacesOfOrigin = CSVUtils.readRawDataCSV("eCH-0135_Code_Heimatorte.csv", PlaceOfOrigin.class)
            .collect(Collectors.toUnmodifiableList());
        Collection<PlaceOfOriginWithLocation> placeOfOriginLocationOverrides =
            CSVUtils.readRawDataCSV("place-of-origin.override.csv", PlaceOfOriginWithLocation.class)
            .collect(Collectors.toUnmodifiableList());

        return new PlacesOfOrigin(locations, placeOfOriginLocationOverrides, rawPlacesOfOrigin);
    }

    public @Pure PlaceOfOrigin finalSuccessor(PlaceOfOrigin place) {
        return finalSuccessor(place, validSucessorsByID);
    }

    public @Pure PlaceOfOrigin immediateSuccessor(PlaceOfOrigin place) {
        return immediateSuccessor(place, validSucessorsByID);
    }

    private static @Pure PlaceOfOrigin immediateSuccessor(PlaceOfOrigin place, Map<Integer, PlaceOfOrigin> validSucessorsByID) {
        if (place.successorID == null) {
            return place;
        } else {
            PlaceOfOrigin successor = validSucessorsByID.get(place.successorID);
            assert successor != null : "@AssumeAssertion(nullness) - place.successorID is an existing key for validSucessorsByID";
            return successor;
        }
    }

    private static @Pure PlaceOfOrigin finalSuccessor(PlaceOfOrigin place, Map<Integer, PlaceOfOrigin> validSucessorsByID) {
        PlaceOfOrigin successor = place;
        while (successor.successorID != null) {
            successor = immediateSuccessor(successor, validSucessorsByID);
        }
        return successor;
    }

    public @Pure Stream<PlaceOfOriginWithLocation> all() {
        return placesOfOrigin.stream();
    }

    public @Pure @Nullable PlaceOfOriginWithLocation dataForPlaceOfOriginNameAndID(String name, int id) {
        return locationsByPlaceOfOriginNameAndID.get(name + ":" + id);
    }

    public @Pure @Nullable PlaceOfOriginWithLocation dataForPlaceOfOriginNameAndFinalSuccessorID(String name, int id) {
        return locationsByPlaceOfOriginNameAndFinalSuccessorID.get(name + ":" + id);
    }

    /** @return <code>null</code> if the id does not uniquely identify a place of origin. */
    public @Pure @Nullable PlaceOfOriginWithLocation dataForPlaceOfOriginByID(int id) {
        return locationsByUniquePlaceOfOriginID.get(id);
    }

    public @Pure @Nullable Location locationForPlaceOfOriginNameAndCanton(String name, String canton) {
        return locationsByPlaceOfOriginNameAndCanton.get(name + ":" + canton);
    }

    public @Pure @Nullable Location locationForPlaceOfOriginNameAndID(String name, int id) {
        @Nullable PlaceOfOriginWithLocation data = dataForPlaceOfOriginNameAndID(name, id);
        return data == null ? null : locations.byName(data.location);
    }

    public @Pure @Nullable Location locationForPlaceOfOriginNameAndFinalSuccessorID(String name, int id) {
        @Nullable PlaceOfOriginWithLocation data = dataForPlaceOfOriginNameAndFinalSuccessorID(name, id);
        return data == null ? null : locations.byName(data.location);
    }

    /** @return <code>null</code> if the id does not uniquely identify a place of origin. */
    public @Pure @Nullable Location locationForPlaceOfOriginByID(int id) {
        @Nullable PlaceOfOriginWithLocation data = dataForPlaceOfOriginByID(id);
        return data == null ? null : locations.byName(data.location);
    }

    /**
     * Generates a CSV file with {@link PlaceOfOriginWithLocation} data.
     *
     * @param argv the path to the generated CSV file is epected in
     *             <code>argv[0]</code>, additional parameters are ignored.
     */
    public static void main(String[] argv) throws IOException, CsvException {
        PlacesOfOrigin data = PlacesOfOrigin.readFromRawData();
        CSVUtils.writeCSV(argv[0], PlaceOfOriginWithLocation.class, data.all(),
            "LOC:INFO", "LOC:NAME", "LOC:CANTON",
            "NS1:PLACEOFORIGINNAME", "NS1:CANTONABBREVIATION", "NS1:PLACEOFORIGINID", "NS1:SUCCESSORID",
            "NS1:HISTORYMUNICIPALITYID", "NS1:VALIDFROM","NS1:VALIDTO","COMMMENT"
        );
    }
}