/* © 2022 Tivano Software GmbH */
package ch.unibe.germanistik.namenatlas.query;

import org.immutables.value.Value;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.querydsl.core.types.Predicate;
import com.querydsl.core.types.dsl.Expressions;

import ch.unibe.germanistik.namenatlas.Tokens;
import ch.unibe.germanistik.namenatlas.Type;
import ch.unibe.germanistik.namenatlas.persistence.QTokensEntity;
import io.swagger.v3.oas.annotations.media.Schema;

/** Filters {@link Tokens} by a regular expression match on the
 *  {@linkplain Type#getDescription() description} of the associated
 *  {@link Type}.
 */
@Schema
@Value.Immutable
@JsonDeserialize(as = ImmutableMatchTypesDescriptionRegexp.class)
public abstract class MatchTypesDescriptionRegexp extends FilterPredicate {
    public abstract String getRegexp();

    @Override
    public Predicate querydslPredicate(QTokensEntity tokens) {

        return Expressions.booleanTemplate(
            // Explicit comparison with "true" is needed for JPQL to recognize
            // that this is a boolean expression.
            // Even though matches_pattern() already returns boolean.
            "FUNCTION('matches_pattern', {0}, {1}) = true",
            tokens.type.description,
            getRegexp()
        );
    }

}
