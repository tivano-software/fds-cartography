/* © 2022 Tivano Software GmbH */
package ch.unibe.germanistik.namenatlas.query;

import org.immutables.value.Value;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.querydsl.core.types.Predicate;
import com.querydsl.jpa.JPAExpressions;
import com.querydsl.jpa.JPQLQuery;

import ch.unibe.germanistik.namenatlas.Tokens;
import ch.unibe.germanistik.namenatlas.persistence.QTokensEntity;
import io.swagger.v3.oas.annotations.media.Schema;

/** Matches {@link Tokens} that have the same {@link ch.unibe.germanistik.namenatlas.Type} as the contained filter. */
@Schema
@Value.Immutable
@JsonDeserialize(as = ImmutableMatchSameTypeAs.class)
public abstract class MatchSameTypeAs extends FilterPredicate {
    @Schema(required = true, implementation = FilterPredicate.SwaggerUIBugWorkaround.class)
    public abstract FilterPredicate getFilter();

    @Override
    public Predicate querydslPredicate(QTokensEntity tokens) {
        QTokensEntity typesRoot = new QTokensEntity("tokensWithType");
        JPQLQuery<Integer> typesQuery = JPAExpressions
            .select(typesRoot.type.id)
            .distinct()
            .from(typesRoot)
            .where(getFilter()
            .querydslPredicate(typesRoot));
        return tokens.type.id.in(typesQuery);
    }
}
