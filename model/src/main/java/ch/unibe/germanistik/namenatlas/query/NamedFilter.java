/* © 2022 Tivano Software GmbH */
package ch.unibe.germanistik.namenatlas.query;

import org.checkerframework.checker.nullness.qual.Nullable;
import org.immutables.value.Value;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;

import ch.unibe.germanistik.namenatlas.Tokens;
import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Represents a query for {@link Tokens}.
 *
 * A query has a {@linkplain #getName() unique name},
 * restricts the {@link Tokens} found by the query through
 * a {@linkplain #getFilter() tokens filter}, and summarizes
 * the results based on .
 */
@Value.Immutable
@JsonDeserialize(as = ImmutableNamedFilter.class)
public interface NamedFilter {
    String getName();
    FilterPredicate getFilter();
    boolean isEditable();

    @Schema(nullable = true)
    @Nullable String getDescription();
}
