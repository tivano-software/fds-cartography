/* © 2022 Tivano Software GmbH */
package ch.unibe.germanistik.namenatlas.query;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.querydsl.core.types.Predicate;

import org.immutables.value.Value;

import ch.unibe.germanistik.namenatlas.Tokens;
import ch.unibe.germanistik.namenatlas.persistence.QTokensEntity;
import io.swagger.v3.oas.annotations.media.Schema;

/** Matches {@link Tokens} that are not matched by the contained filter. */
@Schema
@Value.Immutable
@JsonDeserialize(as = ImmutableMatchNot.class)
public abstract class MatchNot extends FilterPredicate {
    @Schema(required = true, implementation = FilterPredicate.SwaggerUIBugWorkaround.class)
    public abstract FilterPredicate getFilter();

    @Override
    public Predicate querydslPredicate(QTokensEntity tokens) {
        return getFilter().querydslPredicate(tokens).not();
    }

}
