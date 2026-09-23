/* (C) 2022 Tivano Software GmbH */
package ch.unibe.germanistik.namenatlas.datapreparation;

import java.io.FileNotFoundException;
import java.io.FileWriter;
import java.io.IOException;
import java.io.Writer;
import java.util.Objects;
import java.util.stream.Stream;

import com.opencsv.bean.CsvBindByName;
import com.opencsv.exceptions.CsvException;

import org.checkerframework.checker.nullness.qual.Nullable;

import ch.unibe.germanistik.namenatlas.Layer;
import ch.unibe.germanistik.namenatlas.Location;
import ch.unibe.germanistik.namenatlas.Tokens;
import ch.unibe.germanistik.namenatlas.Type;
import ch.unibe.germanistik.namenatlas.datapreparation.LocationsForBFSOrigin.LocationForBFSOrigin;
import ch.unibe.germanistik.namenatlas.datapreparation.LocationsForBFSOrigin.MatchType;
import ch.unibe.germanistik.namenatlas.datapreparation.LocationsForBFSResidence.LocationForBFSResidence;
import ch.unibe.germanistik.namenatlas.datapreparation.TokensCollector.IntermediateTokens;
import ch.unibe.germanistik.namenatlas.persistence.TypeEntity;

/**
 * <h2>Import {@link Type} and {@link Tokens} data provided by the
 * <a href="../apidocs/ch/unibe/germanistik/namenatlas/DataProvider.html#BFS">Swiss
 * Federal Statistics Office</a></h2>
 *
 * <p>
 * Constructs (incomplete) {@link Type} and (complete) {@link Tokens} entries
 * from the {@linkplain Locations imported location data} and the raw data in
 * <code>../../NACHNAMEN_TOTAL_2020.csv</code>.
 * </p>
 *
 * <p>
 * The {@link Type} entries are incomplete in the sense that only
 * {@link Type#getName()}
 * is filled in correctly and all other properties are empty or not set.
 * </p>
 *
 * <p>
 * {@link TypesTokensBFS#main(java.lang.String[])} writes the converted data to
 * a CSV file.
 * </p>
 */
public class TypesTokensBFS {

    /** Raw data as read from <code>NACHNAMEN_TOTAL_2020.csv</code> */
    public static class RawBFSData {
        // The data file from BFS includes a UTF-8 byte order marker ("BOM")
        // which is not handled properly by java, and consequently messes up
        // the column name for the first column. As a workaround, prepend
        // the string representation of the BOM (\uFEFF) to the column name
        // because we do not want to change the file as provided by BFS
        @CsvBindByName(column = "\uFEFFofficialName")
        public final String name;

        @CsvBindByName(column = "originName1")
        public final String placeOfOriginName;

        @CsvBindByName(column = "placeOfOriginId1")
        // Note: This is NOT always the ID corresponding to placeOfOriginName, but may be the ID of
        // the final successor of placeOfOriginName according to eCH-0135_Code_Heimatorte.csv
        public final int placeOfOriginId;

        @CsvBindByName(column = "reportingmunicipalityId")
        public final int reportingMunicipalityId;

        @CsvBindByName(column = "reportingCantonAbbr")
        public final String reportingMunicipalityCanton;

        @CsvBindByName(column = "residentPermit")
        public final int residentPermit;

        public RawBFSData() {
            this.name = this.placeOfOriginName = this.reportingMunicipalityCanton = "";
            this.placeOfOriginId = this.reportingMunicipalityId = this.residentPermit = 0;
        }

        public boolean hasValidResidentPermitColumn() {
            return residentPermit == 2
                || residentPermit == 3
                || residentPermit == -2;
        }

        public boolean isSwissCitizen() {
            return residentPermit == -2;
        }

        /**
         * Checks if this entry has a valid place of origin.
         * Entries without a place of origin (e.g. for immigrants)
         * have a value of -8 or -9 for {@link #placeOfOriginId},
         * and a value of "-08", "-09" or "?" for {@link #placeOfOriginName}
         */
        public boolean hasValidPlaceOfOrigin() {
            return placeOfOriginId != -8
                && placeOfOriginId != -9
                && !placeOfOriginName.equals("-08")
                && !placeOfOriginName.equals("-09")
                && !placeOfOriginName.equals("?");
        }

        @Override
        public int hashCode() {
            return Objects.hash(name, placeOfOriginName, placeOfOriginId);
        }

        @Override
        public boolean equals(@Nullable Object obj) {
            if (this == obj)
                return true;
            if (obj == null)
                return false;
            if (getClass() != obj.getClass())
                return false;
            RawBFSData other = (RawBFSData) obj;
            return Objects.equals(name, other.name) && Objects.equals(placeOfOriginName, other.placeOfOriginName)
                    && placeOfOriginId == other.placeOfOriginId;
        }

        @Override
        public String toString() {
            return "RawBFSData [name=" + name + ", placeOfOriginName=" + placeOfOriginName
                    + ", placeOfOriginSuccessorID=" + placeOfOriginId + "]";
        }


    }

    private final String filename;
    private final LocationsForBFSOrigin placesOfOrigin;
    private final LocationsForBFSResidence placesOfResidence;
    private final Locations locations;


    private TypesTokensBFS(String filename) {
        this.placesOfOrigin = LocationsForBFSOrigin.readFromIntermediateData();
        this.placesOfResidence = LocationsForBFSResidence.readFromIntermediateData();
        this.locations = Locations.readFromRawData();
        this.filename = filename;
    }

    public static TypesTokensBFS readFromRawData() throws FileNotFoundException {
        @Nullable String filename = System.getProperty("bfs-data.filename");
        if (filename == null || filename.isBlank()) {
            throw new IllegalStateException("System property 'bfs-data.filename' is either empty or not defined");
        }
        return new TypesTokensBFS(filename);
    }

    public static @Nullable Location locationByResidence(RawBFSData raw, LocationsForBFSResidence placesOfResidence, Locations locations) {
        @Nullable LocationForBFSResidence residence = placesOfResidence.find(raw);
        return residence != null && residence.info != LocationsForBFSResidence.MatchType.UNKNOWN
             ? locations.byName(residence.locationName)
             : null;
    }
    public @Nullable Location locationByResidence(RawBFSData raw) {
        return locationByResidence(raw, placesOfResidence, locations);
    }

    public static @Nullable Location locationByOrigin(RawBFSData raw, LocationsForBFSOrigin placesOfOrigin, Locations locations) {
        @Nullable LocationForBFSOrigin loc = placesOfOrigin.find(raw);
        return loc == null || loc.info == MatchType.UNKNOWN ? null : locations.byName(loc.locationName);
    }
    public @Nullable Location locationByOrigin(RawBFSData raw) {
        return locationByOrigin(raw, this.placesOfOrigin, this.locations);
    }

    Iterable<RawBFSData> rawData() {
        try {
            return CSVUtils.csvReaderForFilename(filename, RawBFSData.class, ';');
        } catch (FileNotFoundException e) {
            throw new IllegalStateException(e);
        }
    }

    public Stream<IntermediateTokens> tokensBFS_ORIGIN() {
        TokensCollector tokens = new TokensCollector();
        rawData().forEach(raw -> {
            if (raw.hasValidPlaceOfOrigin()) {
                @Nullable Location loc = locationByOrigin(raw, placesOfOrigin, locations);
                assert loc != null : "@AssumeAssertion(nullness) - every entry with a valid place of origin has a location";
                tokens.addTokens(raw.name, loc, Layer.ID.BFS_ORIGIN, 1);
            }
        });
        return tokens.all();
    }

    public Stream<IntermediateTokens> tokensBFS_CH() {
        TokensCollector tokens = new TokensCollector();
        rawData().forEach(raw -> {
            if (raw.isSwissCitizen()) {
                @Nullable Location loc = locationByResidence(raw, placesOfResidence, locations);
                assert loc != null : "@AssumeAssertion(nullness) - every entry has a valid place of residence";
                tokens.addTokens(raw.name, loc, Layer.ID.BFS_CH, 1);
            }
        });
        return tokens.all();
    }

    public Stream<IntermediateTokens> tokensBFS_OTHER() {
        TokensCollector tokens = new TokensCollector();
        rawData().forEach(raw -> {
            if (!raw.isSwissCitizen()) {
                @Nullable Location loc = locationByResidence(raw, placesOfResidence, locations);
                assert loc != null : "@AssumeAssertion(nullness) - every entry has a valid place of residence";
                tokens.addTokens(raw.name, loc, Layer.ID.BFS_OTHER, 1);
            }
        });
        return tokens.all();
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
     * Source data is expected to exist in a file with a file name determined by the system property <code>bfs-data.filename</code>.
     * </p>
     *
     * @param argv the path to the generated CSV file is expected in
     *             <code>argv[0]</code>. Any additional parameters are ignored.
     */
    public static void main(String[] argv) throws IOException, CsvException {
        TypesTokensBFS data = TypesTokensBFS.readFromRawData();
        final String[] COLUMNS = { "TYPE", "LOCATION", "LAYER", "TOKENS" };
        try (Writer out = new FileWriter(argv[0])) {
            CSVUtils.writeCSV(
                out,
                TokensCollector.IntermediateTokens.class,
                data.tokensBFS_ORIGIN(),
                true,
                COLUMNS
            );
            CSVUtils.writeCSV(
                out,
                TokensCollector.IntermediateTokens.class,
                data.tokensBFS_CH(),
                false,
                COLUMNS
            );
            CSVUtils.writeCSV(
                out,
                TokensCollector.IntermediateTokens.class,
                data.tokensBFS_OTHER(),
                false,
                COLUMNS
            );
        }
    }

}
