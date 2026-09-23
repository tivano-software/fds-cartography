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
@JsonDeserialize(as = ImmutableMatchSameLocationAs.class)
public abstract class MatchSameLocationAs extends FilterPredicate {
    @Schema(required = true, implementation = FilterPredicate.SwaggerUIBugWorkaround.class)
    public abstract FilterPredicate getFilter();

    @Override
    public Predicate querydslPredicate(QTokensEntity tokens) {
        QTokensEntity locationsRoot = new QTokensEntity("tokensWithLocation");
        JPQLQuery<Integer> typesQuery = JPAExpressions
            .select(locationsRoot.location.id)
            .distinct()
            .from(locationsRoot)
            .where(getFilter()
            .querydslPredicate(locationsRoot));
        return tokens.location.id.in(typesQuery);
    }

}
