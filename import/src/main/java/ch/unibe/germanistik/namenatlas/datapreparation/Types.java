/* © 2022 Tivano Software GmbH */
package ch.unibe.germanistik.namenatlas.datapreparation;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

import com.opencsv.bean.CsvBindByName;
import com.opencsv.exceptions.CsvException;

import org.checkerframework.checker.nullness.qual.Nullable;

import ch.unibe.germanistik.namenatlas.DataProvider;
import ch.unibe.germanistik.namenatlas.ImmutableType;
import ch.unibe.germanistik.namenatlas.Type;
import ch.unibe.germanistik.namenatlas.datapreparation.TokensCollector.IntermediateTokens;

/**
 * <h2>Generate final {@link Type} data from the intermediate files produced by {@link TypesTokensHLS} and {@link TypesTokensBFS}.</h2>
 *
 * <p>
 * {@link Types#main(java.lang.String[])} writes the converted data to
 * a CSV file.
 * </p>
 */

public class Types {
    private final Map<String, ImmutableType> typesByName;

    private Types(Map<String, ImmutableType> typesByName) {
        this.typesByName = typesByName;
    }

    public static Types readFromIntermediateData() {
        TreeMap<String, Type> types = new TreeMap<>();
        CSVUtils.csvReaderForResource("intermediate/types-tokens.bfs.csv", IntermediateTokens.class, ',')
        .forEach(entry -> {
            if (!types.containsKey(entry.type)) {
                types.put(
                    entry.type,
                    ImmutableType.builder()
                        .withId(0)
                        .withName(entry.type)
                        .addDataProviders(DataProvider.BFS)
                        .build()
                );
            }
        });
        CSVUtils.csvReaderForResource("intermediate/types-tokens.hls.csv", IntermediateTokens.class, ',')
        .forEach(entry -> {
            @Nullable Type existing = types.get(entry.type);
            if (existing == null) {
                types.put(
                    entry.type,
                    ImmutableType.builder()
                        .withId(0)
                        .withName(entry.type)
                        .addDataProviders(DataProvider.HLS_FAM)
                        .build()
                );
            } else if (!existing.getDataProviders().contains(DataProvider.HLS_FAM)) {
                types.put(
                    entry.type,
                    ImmutableType.builder().from(existing)
                        .addDataProviders(DataProvider.HLS_FAM)
                        .build()
                );
            }
        });
        CSVUtils.csvReaderForResource("intermediate/types-tokens.example.csv", IntermediateTokens.class, ',')
        .forEach(entry -> {
            @Nullable Type existing = types.get(entry.type);
            if (existing == null) {
                types.put(
                    entry.type,
                    ImmutableType.builder()
                        .withId(0)
                        .withName(entry.type)
                        .addDataProviders(DataProvider.EXAMPLE)
                        .build()
                );
            } else if (!existing.getDataProviders().contains(DataProvider.EXAMPLE)) {
                types.put(
                    entry.type,
                    ImmutableType.builder().from(existing)
                        .addDataProviders(DataProvider.EXAMPLE)
                        .build()
                );
            }
        });
        AtomicInteger typeId = new AtomicInteger(1);
        return new Types(types.entrySet().stream()
            .collect(Collectors.toMap(
                entry -> entry.getKey(),
                entry -> ImmutableType.builder().from(entry.getValue())
                            .withId(typeId.getAndIncrement())
                            .build(),
                (v1, v2) -> v1,
                LinkedHashMap::new)
            )
        );
    }

    public @Nullable Type get(String name) {
        return typesByName.get(name);
    }

    public static class CSVType {
        @CsvBindByName public final int id;
        @CsvBindByName public final String name;
        @CsvBindByName public final String dataProviders;
        @CsvBindByName public final String languageCategories;
        @CsvBindByName public final String namingMotives;
        @CsvBindByName public final @Nullable String description;

        public CSVType(Type other) {
            this.id = other.getId();
            this.name = other.getName();
            this.dataProviders = asPostgresArrayLiteral(other.getDataProviders());
            this.languageCategories = asPostgresArrayLiteral(other.getLanguageCategories());
            this.namingMotives = asPostgresArrayLiteral(other.getNamingMotives());
            this.description = other.getDescription();
        }

        private static String asPostgresArrayLiteral(Set<? extends Enum<?>> value) {
            return "{" + value.stream().map(val -> val.name()).collect(Collectors.joining(", ")) +"}";
        }

    }

    /**
     * Generates a CSV file with final {@link Type} data.
     *
     * @param argv the path to the generated CSV file is expected in
     *             <code>argv[0]</code>. Any additional parameters are ignored.
     */
    public static void main(String[] argv) throws IOException, CsvException {
        Types types = Types.readFromIntermediateData();
        CSVUtils.writeCSV(argv[0], CSVType.class, types.typesByName.values().stream().map(CSVType::new),
            "ID", "NAME", "LANGUAGECATEGORIES", "NAMINGMOTIVES", "DATAPROVIDERS", "DESCRIPTION"
        );
    }

}
