/* (C) 2021 Tivano Software GmbH */
package ch.unibe.germanistik.namenatlas;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;

import org.checkerframework.checker.signedness.qual.Unsigned;
import org.immutables.value.Value;

/** Occurrence count of a {@link Type} for a given {@link Location} and {@link Layer} */
@Value.Immutable
@JsonDeserialize(as = ImmutableTokens.class)
public interface Tokens {
    Type getType();
    Location getLocation();
    Layer getLayer();
    @Unsigned int getTokens();
}
