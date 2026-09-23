/* (C) 2022 Tivano Software GmbH */
package ch.unibe.germanistik.namenatlas.datapreparation;

import java.io.IOException;
import java.util.Collection;
import java.util.Collections;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.checkerframework.checker.nullness.qual.EnsuresNonNullIf;
import org.checkerframework.checker.nullness.qual.Nullable;

import com.opencsv.bean.CsvBindByName;
import com.opencsv.exceptions.CsvException;

import ch.unibe.germanistik.namenatlas.Layer;
import ch.unibe.germanistik.namenatlas.Location;
import ch.unibe.germanistik.namenatlas.Tokens;
import ch.unibe.germanistik.namenatlas.Type;
import ch.unibe.germanistik.namenatlas.persistence.TypeEntity;

/**
 * <h2>Import {@link Type} and {@link Tokens} data from the
 * <a href="https://hls-dhs-dss.ch/famn/?lg=e">Register of Swiss
 * Surnames</a>.</h2>
 *
 * <p>
 * Constructs (incomplete) {@link Type} and (complete) {@link Tokens} entries
 * from the {@linkplain Locations imported location data} and the raw data in
 * <code>historische_familiennamen.csv</code>.
 * </p>
 *
 * <p>
 * The {@link Type} entries are incomplete in the sense that only
 * {@link Type#getName()} is filled in correctly and all other properties are
 * empty or not set.
 * </p>
 *
 * <p>
 * {@link TypesTokensHLS#main(java.lang.String[])} writes the converted data to
 * a CSV file.
 * </p>
 */
public class TypesTokensHLS {

    /** Raw data as read from <code>historische_familiennamen.csv</code> */
    public static class RawHLSData {
        @CsvBindByName
        public final String name;
        @CsvBindByName
        public final String canton;
        @CsvBindByName
        public final String commune;
        @CsvBindByName
        public final String origin;
        @CsvBindByName
        public final String categ;
        @CsvBindByName
        public final String bourg;

        public RawHLSData() {
            this.name = this.canton =  this.commune =  this.origin = this.categ = this.bourg = "";
        }

        @EnsuresNonNullIf(expression = "name", result = true)
        @EnsuresNonNullIf(expression = "canton", result = true)
        @EnsuresNonNullIf(expression = "commune", result = true)
        @EnsuresNonNullIf(expression = "categ", result = true)
        public boolean isValid() {
            return !name.isBlank()
                    && !canton.isBlank()
                    && !commune.isBlank()
                    && !categ.isBlank()
                    && ("a".equals(categ) || "b".equals(categ) || "c".equals(categ));
        }

        @Override
        public int hashCode() {
            return Objects.hash(canton, categ, commune, name, origin);
        }

        @Override
        public boolean equals(@Nullable Object obj) {
            if (this == obj)
                return true;
            if (obj == null)
                return false;
            if (getClass() != obj.getClass())
                return false;
            RawHLSData other = (RawHLSData) obj;
            return Objects.equals(canton, other.canton) && Objects.equals(categ, other.categ)
                    && Objects.equals(commune, other.commune) && Objects.equals(name, other.name)
                    && Objects.equals(origin, other.origin);
        }

        @Override
        public String toString() {
            return "RawHLSData [name=" + name + ", categ=" + categ + ", commune=" + commune + ", canton=" + canton + ", origin=" + origin + "]";
        }

    }

    /**
     * Entries to ignore in <code>historische_familiennamen.csv</code>.
     */
    public static class HLSIgnoreByLine {
        @CsvBindByName(column = "Line number in raw-data/historische_familiennnamen.csv")
        public final int line;
        @CsvBindByName(column = "Reason")
        public final String reason;

        public HLSIgnoreByLine() {
            this(0, "");
        }

        public HLSIgnoreByLine(int line, String reason) {
            this.line = line;
            this.reason = reason;
        }

    }

    /**
     * Origin values to ignore in <code>historische_familiennamen.csv</code>.
     */
    public static class HLSIgnoredOrigin {
        @CsvBindByName(column = "HLS:ORIGIN")
        public final String origin;
        public HLSIgnoredOrigin() {
            origin = "";
        }
    }

    /**
     * Manual overrides for {@link #locationByCommune(RawHLSData)}.
     */
    public static class LocationByCommuneOverride {
        @CsvBindByName(column = "HLS:COMMUNE") public final String commune;
        @CsvBindByName(column = "HLS:CANTON") public final String canton;
        @CsvBindByName(column = "NS1:PLACEOFORIGINNAME") public final String placeOfOriginName;
        @CsvBindByName(column = "NS1:CANTONABBREVIATION") public final String placeOfOriginCanton;
        public LocationByCommuneOverride() {
            commune = canton = placeOfOriginName = placeOfOriginCanton = "";
        }
    }

    /**
     * Manual overrides for {@link #locationByOrigin(RawHLSData)}.
     */
    public static class LocationByOriginOverride {
        @CsvBindByName(column = "HLS:ORIGIN") public final String origin;
        @CsvBindByName(column = "NS1:PLACEOFORIGINNAME") public final String placeOfOriginName;
        @CsvBindByName(column = "NS1:CANTONABBREVIATION") public final String placeOfOriginCanton;
        public LocationByOriginOverride() {
            origin = placeOfOriginName = placeOfOriginCanton = "";
        }
    }

    final Collection<RawHLSData> rawData; // Not private because TypesTokensHLSTest needs access
    private final TokensCollector tokens;
    private final PlacesOfOrigin placesOfOrigin;
    private final Map<String,Location> locationByCommuneOverrides;
    private final Map<String,Location> locationByOriginOverrides;
    private final Set<String> ignoredOrigins;
    private final Set<String> ignoredCommuneAndCanton;

    private TypesTokensHLS(
        Collection<RawHLSData> data,
        Collection<LocationByCommuneOverride> locationByCommuneOverrides,
        Collection<LocationByOriginOverride> locationByOriginOverrides,
        Set<String> ignoredOrigins,
        Set<String> ignoredCommuneAndCanton)
    {
        this.rawData = Collections.unmodifiableCollection(data);
        this.tokens = new TokensCollector();
        this.placesOfOrigin = PlacesOfOrigin.readFromRawData();
        this.ignoredOrigins = Collections.unmodifiableSet(ignoredOrigins);
        this.ignoredCommuneAndCanton = Collections.unmodifiableSet(ignoredCommuneAndCanton);
        Locations locations = Locations.readFromRawData();

        this.locationByCommuneOverrides = locationByCommuneOverrides.stream()
            .collect(Collectors.toUnmodifiableMap(
                    entry -> entry.commune + ":" + entry.canton,
                    entry -> {
                        @Nullable Location loc = placesOfOrigin.locationForPlaceOfOriginNameAndCanton(entry.placeOfOriginName, entry.placeOfOriginCanton);
                        if (loc == null) {
                            loc = locations.byName(entry.placeOfOriginName);
                        }
                        assert loc != null : "@AssumeAssertion(nullness) - overrides can be looked up either in PlacesOfOrigin or in Locations";
                        return loc;
                    }
            ));

        this.locationByOriginOverrides = locationByOriginOverrides.stream()
            .collect(Collectors.toUnmodifiableMap(
                    entry -> entry.origin,
                    entry -> {
                        @Nullable Location loc = placesOfOrigin.locationForPlaceOfOriginNameAndCanton(entry.placeOfOriginName, entry.placeOfOriginCanton);
                        if (loc == null) {
                            loc = locations.byName(entry.placeOfOriginName);
                        }
                        assert loc != null : "@AssumeAssertion(nullness) - overrides can be looked up either in PlacesOfOrigin or in Locations";
                        return loc;
                    }
            ));

        // Collect layers HLS_A, HLS_B and HLS_C first. Location for these
        // layers is determined by RawHLSData.commune and RawHLSData.canton
        Pattern bourgCountRE = Pattern.compile(",");
        data.stream().filter(raw -> isHLSCommuneCandidate(raw, this.ignoredCommuneAndCanton)).forEach(raw -> {
            if (!raw.isValid()) { return; }

            @Nullable Location loc = locationByCommune(raw, placesOfOrigin, this.locationByCommuneOverrides);
            if (loc == null) { return; }

            final Layer.ID layer;
            switch (raw.categ) {
                case "a": layer = Layer.ID.HLS_A; break;
                case "b": layer = Layer.ID.HLS_B; break;
                case "c": layer = Layer.ID.HLS_C; break;
                default: return;
            }

            // We count every year mentioned in count.bourg as one token.
            // Since count.bourg is either empty or a comma separated list of years
            // (as validated by {@link TypesTokensHLSTest#testBourgColumIsValid()),
            // the token count is the number of "," in raw.bourg + 1
            int tokenCount = Math.toIntExact(bourgCountRE.matcher(raw.bourg).results().count() + 1);
            tokens.addTokens(raw.name, loc, layer, tokenCount);
        });

        // Now collect the HLS_ORIGIN layer. Location in this layer is
        // determined by RawHLSData.origin, and data is only included if either
        // - RawHLSData.categ is "a" or
        // - RawHLSData.categ is "b" and there is no entry for this name and
        // location in layer HLS_A
        data.stream().filter(raw -> isHLSOriginCandidate(raw, this.ignoredOrigins)).forEach(raw -> {
            @Nullable Location loc = locationByOrigin(raw, placesOfOrigin, this.locationByOriginOverrides);
            assert loc != null : "@AssumeAssertion(nullness) - every place of origin has a location assigned";
            if (loc == null) { return; }

            if (tokens.get(raw.name, loc.getName(), Layer.ID.HLS_A) == null) {
                tokens.addTokens(raw.name, loc, Layer.ID.HLS_ORIGIN, 1);
            }
        });
    }

    public static boolean isHLSOriginCandidate(RawHLSData raw, Set<String> ignore) {
        return ("a".equals(raw.categ) || ("b".equals(raw.categ)))
           && !(raw.origin.isBlank() || raw.origin.equals("*"))
           && !ignore.contains(raw.origin);
    }

    public static boolean isHLSCommuneCandidate(RawHLSData raw, Set<String> ignore) {
        return !ignore.contains(raw.commune + ":" + raw.canton);
    }
    public boolean isHLSCommuneCandidate(RawHLSData raw) {
        return isHLSOriginCandidate(raw, ignoredCommuneAndCanton);
    }

    public boolean isHLSOriginCandidate(RawHLSData raw) {
        return isHLSOriginCandidate(raw, ignoredOrigins);
    }

    /** Find the location for <code>raw.commune</code> */
    private static @Nullable Location locationByCommune(RawHLSData raw, PlacesOfOrigin placesOfOrigin, Map<String,Location> override) {
        // First check if we have a manual override for this entry
        @Nullable Location loc = override.get(raw.commune + ":" + raw.canton);

        // If not, check if we have an entry in placesOfOrigin
        if (loc == null) {
            loc = placesOfOrigin.locationForPlaceOfOriginNameAndCanton(raw.commune, raw.canton);
        }

        // Try again with the canton id appended if not found. Note that eCH-0135_Code_Heimatorte.csv
        // uses () around the canton id
        if (loc == null) {
            loc = placesOfOrigin.locationForPlaceOfOriginNameAndCanton(raw.commune + " (" + raw.canton + ")", raw.canton);
        }
        return loc;
    }

    public @Nullable Location locationByCommune(RawHLSData raw) {
        return locationByCommune(raw, placesOfOrigin, locationByCommuneOverrides);
    }

    /** Find the location for <code>raw.origin</code> */
    private static @Nullable Location locationByOrigin(RawHLSData raw, PlacesOfOrigin placesOfOrigin, Map<String,Location> overrides) {
        @Nullable Location loc = overrides.get(raw.origin);
        if (loc == null) {
            Matcher m = PlacesOfOrigin.PLACENAME_WITH_CANTON_REGEXP.matcher(raw.origin);
            if (m.matches()) {
                String name = m.group(1);
                String canton = m.group(2);
                assert name != null && canton != null : "@AssumeAssertion(nullness) - guaranteed by the regexp match";
                return placesOfOrigin.locationForPlaceOfOriginNameAndCanton(name, canton);
            }
        }
        return loc;
    }

    public @Nullable Location locationByOrigin(RawHLSData raw) {
        return locationByOrigin(raw, placesOfOrigin, locationByOriginOverrides);
    }

    public static TypesTokensHLS readFromRawData() {
        Set<Integer> ignoredEntries = CSVUtils.readRawDataCSV("types-tokens.hls.ignore.csv", HLSIgnoreByLine.class, ';')
                .map(entry -> entry.line)
                .collect(Collectors.toUnmodifiableSet());
        AtomicInteger lineNumber = new AtomicInteger(2); // first line in CSV contains headers
        return new TypesTokensHLS(CSVUtils
            .readRawDataCSV("historische_familiennamen.csv", RawHLSData.class, ':')
            .filter(unused -> {
                    Integer pos = lineNumber.getAndIncrement();
                    return !ignoredEntries.contains(pos);
                })
            .collect(Collectors.toUnmodifiableList()),
            CSVUtils.readRawDataCSV("hls-commune.override.csv", LocationByCommuneOverride.class).collect(Collectors.toUnmodifiableList()),
            CSVUtils.readRawDataCSV("hls-origin.override.csv", LocationByOriginOverride.class).collect(Collectors.toUnmodifiableList()),
            CSVUtils.readRawDataCSV("hls-origin.ignore.csv", LocationByOriginOverride.class).map(e -> e.origin).collect(Collectors.toUnmodifiableSet()),
            CSVUtils.readRawDataCSV("hls-commune.ignore.csv", LocationByCommuneOverride.class).map(e -> e.commune + ":" + e.canton).collect(Collectors.toUnmodifiableSet())
        );
    }

    /**
     * Generates a CSV file with intermediate {@link Tokens} data.
     *
     * <p>
     * "Intermediate" means that the <code>TYPE</code> column of the generated
     * file does not contain the numeric ID of the referenced {@link TypeEntity},
     * but
     * the (unique) {@link TypeEntity#getName()}.
     * </p>
     *
     * <p>
     * Source data is expected to exist on the class path as resource
     * <code>/raw-data/historische_familiennamen.csv</code>.
     * </p>
     *
     * @param argv the path to the generated CSV file is epected in
     *             <code>argv[0]</code>,
     *             additional parameters are ignored.
     */
    public static void main(String[] argv) throws IOException, CsvException {
        TypesTokensHLS data = TypesTokensHLS.readFromRawData();
        CSVUtils.writeCSV(argv[0], TokensCollector.IntermediateTokens.class, data.tokens.all(),
        "TYPE", "LOCATION", "LAYER", "TOKENS");
    }

}
