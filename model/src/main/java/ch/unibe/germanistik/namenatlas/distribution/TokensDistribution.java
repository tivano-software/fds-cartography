/* © 2023 Tivano Software GmbH */
package ch.unibe.germanistik.namenatlas.distribution;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import org.checkerframework.checker.nullness.qual.Nullable;

import ch.unibe.germanistik.namenatlas.Tokens;
import ch.unibe.germanistik.namenatlas.Type;

/**
 * Represents a distribution of {@linkplain Tokens tokens} associated with {@linkplain Type types}.
 * The main purpose of this class is to enable calculating a distance between two tokens distributions.
 *
 * Mathematically, a {@code TokensDistribution} instance is a vector with one dimension
 * per {@link Type}, and the number of {@link Tokens} as the value for the corresponding dimension.
 *
 * The distance between two type distributions is defined as the squared sine of the angle
 * between those vectors.
 */
public class TokensDistribution<Key extends Object> {
    private final Map<Key, Double> data;

    public TokensDistribution(Map<Key, Integer> tokensByTypes) {
        // Since types distributions are usually sparse, we use a map
        // internally to represent the vector. The values of keys not
        // in the map are assumed to be 0.
        //
        // And since we want to calculate the squared sine for the distances,
        // we normalize the data to an (euclidean) length of 1 so that we can
        // later on simply calculate the dot product of the distributions to
        // get the cosine, square that, and subtract it from 1 to get the squared sine.
        double scaleSquared = tokensByTypes.values().stream()
            .map(tokens -> { double d = Double.valueOf(tokens); return d*d;})
            .reduce(0.0d, Double::sum);
        double scale = Math.sqrt(scaleSquared);
        Map<Key, Double> mutableData = new HashMap<>(tokensByTypes.size());
        tokensByTypes.entrySet().forEach(entry -> {
            double scaled = Double.valueOf(entry.getValue())/scale;
            if (scaled!=0) {
                mutableData.put(entry.getKey(), scaled);
            }
        });
        this.data = Collections.unmodifiableMap(mutableData);
    }

    public double similarityTo(TokensDistribution<Key> other) {
        // similarity is the square of the cosine of the angle between both distributions.
        // As types distributions are normalized (see constructor), we can simply
        // calculate the dot product of both to get the cosine, and square that.
        // And since we only need to care about entries with keys which occur in *both* distributions
        // (since all entries that are not present in a distribution are assumed to be 0 and don't
        // contribute to the dot product), we can further optimize by iterating over the distribution
        // that has the smallest number of actual entries.
        if (this.data.size() <= other.data.size()) {
            double cos = this.data.entrySet().stream()
                .map(entry -> {
                        double a = entry.getValue();
                        @Nullable Double b = other.data.get(entry.getKey());
                        return b == null ? 0.0d : a*b;
                    })
                .reduce(0.0d, Double::sum);
            return cos*cos;
        } else {
            return other.similarityTo(this);
        }
    }

    public double distanceTo(TokensDistribution<Key> other) {
        // distance is the square of the sine of the angle between both distributions.
        // Because we already have the square of the cosine as similarity, we simply
        // subtract it from 1 to get the distance.
        // Round to 11 significant digits to avoid garbage because of rounding errors,
        // most notably for similarity values near 1.
        return 1e-11*Math.rint(1e11*(1 - similarityTo(other)));
    }
}
