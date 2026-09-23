/* © 2022 Tivano Software GmbH */
package ch.unibe.germanistik.namenatlas.query;

import org.immutables.value.Value;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.querydsl.core.types.Predicate;
import com.querydsl.core.types.dsl.Expressions;

import ch.unibe.germanistik.namenatlas.NamingMotive;
import ch.unibe.germanistik.namenatlas.Tokens;
import ch.unibe.germanistik.namenatlas.Type;
import ch.unibe.germanistik.namenatlas.persistence.QTokensEntity;
import io.swagger.v3.oas.annotations.media.Schema;

/** Filters {@link Tokens} by the {@linkplain Type#getNamingMotives() naming motives}
 *  of the associated {@link Type}.
 */
@Schema
@Value.Immutable
@JsonDeserialize(as = ImmutableMatchNamingMotive.class)
public abstract class MatchNamingMotive extends FilterPredicate {
    public abstract  NamingMotive getNamingMotive();

    @Override
    public Predicate querydslPredicate(QTokensEntity tokens) {
        return Expressions.booleanTemplate(
            // Explicit comparison with "true" is needed for JPQL to recognize
            // that this is a boolean expression.
            // Even though arraycontains() already returns boolean.
            "FUNCTION('has_element', {0}, {1}) = true",
            tokens.type.namingMotives,
            getNamingMotive().name()
        );
    }

}
