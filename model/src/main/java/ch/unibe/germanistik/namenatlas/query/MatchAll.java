/* © 2022 Tivano Software GmbH */
package ch.unibe.germanistik.namenatlas.query;

import java.util.List;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Predicate;

import org.immutables.value.Value;

import ch.unibe.germanistik.namenatlas.Tokens;
import ch.unibe.germanistik.namenatlas.persistence.QTokensEntity;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;

/** Matches {@link Tokens} that are matched by all contained filters. */
@Schema
@Value.Immutable
@JsonDeserialize(as = ImmutableMatchAll.class)
public abstract class MatchAll extends FilterPredicate {
    @ArraySchema(schema = @Schema(implementation = FilterPredicate.SwaggerUIBugWorkaround.class))
    public abstract List<FilterPredicate> getFilters();

    @Override
    public Predicate querydslPredicate(QTokensEntity tokens) {
        BooleanBuilder result = new BooleanBuilder();
        getFilters().forEach(filter -> result.and(filter.querydslPredicate(tokens)));
        return result;
    }


}
