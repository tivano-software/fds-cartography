/* © 2022 Tivano Software GmbH */
package ch.unibe.germanistik.namenatlas.datapreparation;

import java.io.FileWriter;
import java.io.IOException;
import java.io.Writer;
import java.util.Spliterator;
import java.util.Spliterators;
import java.util.stream.Stream;
import java.util.stream.StreamSupport;

import com.opencsv.bean.CsvBindByName;
import com.opencsv.exceptions.CsvException;

import ch.unibe.germanistik.namenatlas.Layer.ID;
import ch.unibe.germanistik.namenatlas.Location;
import ch.unibe.germanistik.namenatlas.Type;
import ch.unibe.germanistik.namenatlas.datapreparation.TokensCollector.IntermediateTokens;

/**
 * <h2>Generate final {@link Tokens} data from the intermediate files produced by {@link TypesTokensHLS} and {@link TypesTokensBFS}.</h2>
 *
 * <p>
 * {@link Tokens#main(java.lang.String[])} writes the converted data to
 * a CSV file.
 * </p>
 */

public class Tokens {

    public static class CSVTokens {
        @CsvBindByName int type;
        @CsvBindByName int location;
        @CsvBindByName int layer = ID.HLS_A.ordinal();
        @CsvBindByName int tokens;

    }

    /**
     * Generates a CSV file with final {@link Tokens} data.
     *
     * @param argv the path to the generated CSV file is expected in
     *             <code>argv[0]</code>. Any additional parameters are ignored.
     */
    public static void main(String[] argv) throws IOException, CsvException {
        Locations locations = Locations.readFromRawData();
        Types types = Types.readFromIntermediateData();
        final String[] COLUMNS = { "TYPE", "LOCATION", "LAYER", "TOKENS" };
        try (Writer out = new FileWriter(argv[0])) {
            CSVUtils.writeCSV(
                out,
                CSVTokens.class,
                readFromIntermediate("types-tokens.bfs.csv", locations, types),
                true,
                COLUMNS
            );
            CSVUtils.writeCSV(
                out,
                CSVTokens.class,
                readFromIntermediate("types-tokens.hls.csv", locations, types),
                false,
                COLUMNS
            );
            CSVUtils.writeCSV(
                out,
                CSVTokens.class,
                readFromIntermediate("types-tokens.example.csv", locations, types),
                false,
                COLUMNS
            );
        }
    }

    private static Stream<CSVTokens> readFromIntermediate(String filename, Locations locations, Types types) {
        Iterable<IntermediateTokens> rawData = CSVUtils.csvReaderForResource(
            "intermediate/" + filename, IntermediateTokens.class, ',');
        Spliterator<IntermediateTokens> spliterator = Spliterators.spliteratorUnknownSize(
            rawData.iterator(), Spliterator.IMMUTABLE);
        return StreamSupport.stream(spliterator, false)
            .map(intermediate -> {
                Type type = types.get(intermediate.type);
                assert type != null : "@AssumeAssertion(nullness) - only valid types in intermediate data";
                Location loc = locations.byName(intermediate.location);
                assert loc != null : "@AssumeAssertion(nullness) - only valid locations in intermediate data";

                CSVTokens tokens = new CSVTokens();
                tokens.tokens = intermediate.tokens;
                tokens.layer = intermediate.layer.ordinal();
                tokens.type = type.getId();
                tokens.location = loc.getId();
                return tokens;
            });
    }
}
