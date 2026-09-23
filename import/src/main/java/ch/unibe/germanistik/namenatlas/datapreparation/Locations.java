/* (C) 2021 Tivano Software GmbH */
package ch.unibe.germanistik.namenatlas.datapreparation;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.checkerframework.checker.nullness.qual.Nullable;
import org.checkerframework.checker.nullness.util.NullnessUtil;
import org.checkerframework.dataflow.qual.Pure;

import com.opencsv.bean.CsvBindByName;
import com.opencsv.exceptions.CsvException;

import ch.unibe.germanistik.namenatlas.ImmutableLocation;
import ch.unibe.germanistik.namenatlas.Location;

/**
 * <h2>Import {@link Location} data.</h2>
 *
 * <p>
 * Constructs {@link Location} entries from the raw data
 * in <code>be-t-00.04-agv-01.csv</code> and the manually maintained
 * data in <code>foreign-locations.csv</code>, and provides lookup
 * methods for {@link Location} entries by name and ID.
 * </p>
 *
 * <p>
 * {@link Locations#main(java.lang.String[])} writes the converted data to a CSV
 * file. The file name is passed in as the first parameter.
 * </p>
 */
public class Locations {

    /**
     * Raw municipality data as read from <code>be-t-00.04-agv-01.csv</code>.
     */
    public static class Municipality {
        @CsvBindByName(column = "GDENR")
        public final int id;

        @CsvBindByName(column = "GDENAME")
        public final String name;

        @CsvBindByName(column = "GDEBZNA")
        public final String district;

        @CsvBindByName(column = "GDEKT")
        public final String canton;

        /** Needed by OpenCSV, should not be used anywhere else. */
        public Municipality() { this(0, "", "", ""); }

        public Municipality(int id, String name, String district, String canton) {
            this.id = id;
            this.name = name;
            this.district = district;
            this.canton = canton;
        }

        public boolean isValid() {
            return id > 0
                && !name.isBlank()
                && !district.isBlank()
                && !canton.isBlank();
        }

        @Override
        public int hashCode() {
            return Objects.hash(canton, district, id, name);
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
            Municipality other = (Municipality) obj;
            return id == other.id
                && Objects.equals(canton, other.canton)
                && Objects.equals(district, other.district)
                && Objects.equals(name, other.name);
        }

        @Override
        public String toString() {
            return "Municipality [id=" + id + ", name=" + name + ", district=" + district + ", canton=" + canton + "]";
        }


    }

    /**
     * Raw foreign location data as read from <code>extra-locations.csv</code>.
     */
    public static abstract class ImportedLocation implements Location {
        @CsvBindByName public final int id;
        @CsvBindByName public final String name;
        @CsvBindByName public final String municipality;
        @CsvBindByName public final String district;
        @CsvBindByName public final String canton;
        @CsvBindByName public final String country;

        protected ImportedLocation(int id, String name, String municipality, String district, String canton, String country) {
            this.id = id;
            this.name = name;
            this.municipality = municipality;
            this.district = district;
            this.canton = canton;
            this.country = country;
        }

        @Override public int getId() { return id; }
        @Override public String getName() { return name; }
        @Override public String getMunicipality() { return municipality; }
        @Override public String getDistrict() { return district; }
        @Override public String getCanton() { return canton; }
        @Override public String getCountry() { return country; }

        @Override
        public int hashCode() {
            return Objects.hash(canton, district, id, name, country);
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
            ImportedLocation other = (ImportedLocation) obj;
            return id == other.id
                && Objects.equals(canton, other.canton)
                && Objects.equals(country, other.country)
                && Objects.equals(district, other.district)
                && Objects.equals(name, other.name);
        }

        @Override
        public String toString() {
            return "ImportedLocation [id=" + id + ", name=" + name + ", municipality=" + municipality + ", district=" + district + ", canton=" + canton + ", country=" + country + "]";
        }

    }

    /**
     * Raw foreign location data as read from <code>extra-locations.csv</code>.
     */
    public static class ForeignLocation extends ImportedLocation {
        /** Needed by OpenCSV, should not be used anywhere else. */
        public ForeignLocation() { super(0, "", "", "", "", ""); }

        public ForeignLocation(int id, String name, String municipality, String district, String canton, String country) {
            super(id, name, municipality, district, canton, country);
        }
    }

    /**
     * Swiss location combined from the data in {@link PLZO_CVS_L95} and {@link Municipality}.
     */
    public static class SwissLocation extends ImportedLocation {

        public SwissLocation(int id, String locationName, Municipality municipality) {
            super(id, locationName, municipality.name, municipality.district, municipality.canton, "CH");
        }
    }

    /**
     * Fine grained location data as read from <code>PLZO_CVS_L95.csv</code>
     */
    public static class PLZO_CVS_L95 {
        @CsvBindByName(column = "Ortschaftsname")
        public final String name;
        @CsvBindByName(column = "BFS-Nr")
        public final int locationID;

        /** Needed by OpenCSV, should not be used anywhere else. */
        public PLZO_CVS_L95() {
            name = "";
            locationID = 0;
        }

        @Override
        public int hashCode() {
            return Objects.hash(locationID, name);
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
            PLZO_CVS_L95 other = (PLZO_CVS_L95) obj;
            return locationID == other.locationID && Objects.equals(name, other.name);
        }
    }

    /**
     * Discarded entries in <code>PLZO_CVS_L95.csv</code> from <code>locations.ignore.csv</code>
     */
    public static class IgnoredLinesPLZO {
        @CsvBindByName(column = "Line number in raw-data/PLZO_CSV_LV95.csv")
        public final int line;
        public IgnoredLinesPLZO() { line = 0; }
    }

    final Collection<PLZO_CVS_L95> plzoLocations;  // Not private because LocationsTest needs access.
    private final Collection<Location> allLocations;
    private final Map<Integer,Location> locationsByID;
    private final Map<String,Location>  locationsByName;

    public Locations(Collection<Municipality> municipalities, Collection<ForeignLocation> otherLocations, Collection<PLZO_CVS_L95> plzoLocations)
    {

        Map<Integer,Municipality> municipalitiesByID = municipalities.stream()
            .collect(Collectors.toMap(
                entry -> entry.id,
                Function.identity(),
                (v1, v2) -> v1,
                LinkedHashMap::new)
            );
        AtomicInteger locationID = new AtomicInteger(0);
        Collection<Location> locations = plzoLocations.stream()
            .filter(entry -> municipalitiesByID.get(entry.locationID) != null)
            .map(entry -> new SwissLocation(
                    locationID.incrementAndGet(),
                    entry.name,
                    // Can assume @NonNull here because of the filter above
                    NullnessUtil.castNonNull(municipalitiesByID.get(entry.locationID))
                )
            )
            .collect(Collectors.toCollection(ArrayList::new));
        locations.addAll(otherLocations);
        this.allLocations = Collections.unmodifiableCollection(locations);
        this.plzoLocations = Collections.unmodifiableCollection(new ArrayList<>(plzoLocations));
        this.locationsByID = Collections.unmodifiableMap(
            this.allLocations.stream()
                .collect(Collectors.toMap(
                        Location::getId,
                        Function.identity(),
                        (v1, v2) -> v1,
                        LinkedHashMap::new))
        );
        this.locationsByName = Collections.unmodifiableMap(
            this.allLocations.stream()
                .collect(Collectors.toMap(
                        Location::getName,
                        Function.identity(),
                        (v1, v2) -> v1,
                        LinkedHashMap::new))
        );
    }

    public static Locations readFromRawData() {
        Set<Integer> ignoredLinesPLZO = CSVUtils.readRawDataCSV("locations.ignore.csv", IgnoredLinesPLZO.class)
            .map(entry -> entry.line)
            .collect(Collectors.toUnmodifiableSet());
        AtomicInteger currentLine = new AtomicInteger(2); // First line is the header and line count starts at 1
        Set<PLZO_CVS_L95> plzo = CSVUtils.readRawDataCSV("PLZO_CSV_LV95.csv", PLZO_CVS_L95.class)
            .filter( _unused -> !ignoredLinesPLZO.contains(currentLine.getAndIncrement()))
            .collect(Collectors.toCollection(LinkedHashSet::new));
        Set<Municipality> municipalities = CSVUtils.readRawDataCSV("be-t-00.04-agv-01.csv", Municipality.class)
            .collect(Collectors.toCollection(LinkedHashSet::new));
        Set<ForeignLocation> otherLocations = CSVUtils.readRawDataCSV("extra-locations.csv", ForeignLocation.class)
            .collect(Collectors.toCollection(LinkedHashSet::new));
        return new Locations(municipalities, otherLocations, plzo);
    }

    public @Pure Stream<Location> all() {
        return allLocations.stream();
    }
    public @Pure Stream<Location> foreign() {
        return allLocations.stream().filter(loc -> loc instanceof ForeignLocation);
    }

    public @Pure @Nullable Location byName(String name) {
        return locationsByName.get(name);
    }
    public @Pure @Nullable Location byID(int id) {
        return locationsByID.get(id);
    }

    /**
     * Generates a CSV file with {@link Location} data that can be imported into
     * the data base.
     *
     * Source data is expected to exist on the class path as resources
     * <code>/raw-data/eCH-0135_Code_Heimatorte.csv</code>,
     * <code>/raw-data/be-t-00.04-agv-01.csv</code> and
     * <code>/raw-data/PLZO_CSV_LV95.csv</code>
     *
     * @param argv the path to the generated CSV file is epected in
     *             <code>argv[0]</code>,
     *             additional parameters are ignored.
     */
    public static void main(String[] argv) throws IOException, CsvException {
        Locations data = Locations.readFromRawData();
        CSVUtils.writeCSV(argv[0], ImmutableLocation.class, data.all().map(
                loc -> {
                    if ("Unterlangenegg".equals(loc.getMunicipality())) {
                        // Special case: Municipalities Oberlangenegg and Unterlangenegg
                        // are handled as one region because most of the population resides
                        // in "Schwarzenegg", parts of which belong to either of the municipalities
                        // (see also https://www.unterlangenegg.ch/portrait/schwarzenegg)
                        //
                        // For mapping, we combine the geographic regions of both municipalities,
                        // which should be reflected in the municipality name.
                        return ImmutableLocation.builder()
                            .withId(loc.getId())
                            .withName(loc.getName())
                            .withMunicipality("Oberlangenegg/Unterlangenegg")
                            .withCanton(loc.getCanton())
                            .withDistrict(loc.getDistrict())
                            .withCountry(loc.getCountry())
                            .build();
                    } else {
                        return ImmutableLocation.copyOf(loc);
                    }
                }
            ),
            "id", "name", "municipality", "district", "canton");
    }
}