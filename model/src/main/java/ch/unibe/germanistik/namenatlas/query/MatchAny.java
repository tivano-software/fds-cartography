/* © 2022 Tivano Software GmbH */
package ch.unibe.germanistik.namenatlas.query;

import java.util.List;
import java.util.Set;
import java.util.TreeSet;

import org.checkerframework.checker.nullness.qual.Nullable;
import org.immutables.value.Value;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Predicate;

import ch.unibe.germanistik.namenatlas.Tokens;
import ch.unibe.germanistik.namenatlas.persistence.QTokensEntity;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Matches {@link Tokens} that is matched by any of the contained filters
 */
@Schema
@Value.Immutable
@JsonDeserialize(as = ImmutableMatchAny.class)
public abstract class MatchAny extends FilterPredicate {
    @ArraySchema(schema = @Schema(implementation = FilterPredicate.SwaggerUIBugWorkaround.class))
    public abstract List<FilterPredicate> getFilters();

    @Override
    public Predicate querydslPredicate(QTokensEntity tokens) {
        final List<FilterPredicate> filters = getFilters();
        // Check if all filters are MatchLocation filters referencing the same location level.
        // If this is the case, we can optimize the SQL by collapsing the "or" of all these filters
        // into a single "location in (...)" statement, which speeds up a typical query from a cluster analysis
        // by a factor of around 3
        final @Nullable FilterPredicate firstFilter = filters.isEmpty() ? null : filters.get(0);
        if (firstFilter instanceof MatchLocation) {
            final MatchLocation prototype = (MatchLocation)firstFilter;
            final MatchLocation.Field targetField = prototype.getField();
            if (filters.stream().allMatch(filter -> filter instanceof MatchLocation && ((MatchLocation)filter).getField() == targetField)) {
                Set<String> combinedMatches = new TreeSet<>();
                filters.forEach(filter -> {
                    combinedMatches.addAll(((MatchLocation)filter).parsedMatch());
                });
                return prototype.querydslPath(tokens).in(combinedMatches);
            }
        }

        // Can't optimize, build a standard or query.
        BooleanBuilder result = new BooleanBuilder();
        getFilters().forEach(filter -> result.or(filter.querydslPredicate(tokens)));
        return result;
    }

}
