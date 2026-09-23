/* (C) 2022 Tivano Software GmbH */
package ch.unibe.germanistik.namenatlas.datapreparation;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Stream;

import com.opencsv.bean.CsvBindByName;

import org.checkerframework.checker.nullness.qual.Nullable;
import org.checkerframework.checker.signedness.qual.Unsigned;
import org.checkerframework.dataflow.qual.Pure;

import ch.unibe.germanistik.namenatlas.Layer;
import ch.unibe.germanistik.namenatlas.Layer.ID;
import ch.unibe.germanistik.namenatlas.Location;
import ch.unibe.germanistik.namenatlas.Tokens;

/**
 * <h2>Helper class for {@link TypesTokensHLS} and {@link TypesTokensBFS}</h2>
 */
class TokensCollector {
    private final Map<String, IntermediateTokens> data;

    TokensCollector() {
        this.data = new LinkedHashMap<>();
    }

    private String keyFor(String typeName, Location location, Layer.ID layer) {
        return keyFor(typeName, location.getName(), layer);
    }
    private String keyFor(String typeName, String location, Layer.ID layer) {
        return (typeName + ":" + location + ":" + layer).intern();
    }

    /** Add tokens for <code>type</code>, <code>location</code> and <code>layer</code> */
    protected void addTokens(String typeName, Location location, Layer.ID layer, @Unsigned int tokens) {
        String key = keyFor(typeName, location, layer);
        @Nullable IntermediateTokens value = data.get(key);
        if (value == null) {
            value = new IntermediateTokens(typeName, location, layer, tokens);
            data.put(key, value);
        } else {
            value.add(tokens);
        }
    }

    public @Nullable IntermediateTokens get(String type, String location, Layer.ID layer) {
        return data.get(keyFor(type, location, layer));
    }

    public @Pure Stream<IntermediateTokens> all() {
        return data.values().stream();
    }

    /** Helper class for collecting tokens and writing the intermediate {@link Tokens} CSV file */
    public static class IntermediateTokens {
        @CsvBindByName
        public final String type;
        @CsvBindByName
        public final String location;
        @CsvBindByName
        public final Layer.ID layer;
        @CsvBindByName
        public @Unsigned int tokens;
        public IntermediateTokens() {
            type = location = "";
            layer = ID.BFS_CH;
        }
        public IntermediateTokens(String type, Location location, Layer.ID layer, @Unsigned int tokens) {
            this.type = type;
            this.location = location.getName();
            this.layer = layer;
            this.tokens = tokens;
        }

        private void add(int tokens) {
            this.tokens += tokens;
        }

    }

}
