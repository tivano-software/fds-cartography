/* © 2022 Tivano Software GmbH */
package ch.unibe.germanistik.namenatlas.query;

import org.immutables.value.Value;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.querydsl.core.types.Predicate;

import ch.unibe.germanistik.namenatlas.Layer;
import ch.unibe.germanistik.namenatlas.Tokens;
import ch.unibe.germanistik.namenatlas.persistence.QTokensEntity;
import io.swagger.v3.oas.annotations.media.Schema;

/** Matches {@link Tokens} by the associated {@link Layer}. */
@Schema
@Value.Immutable
@JsonDeserialize(as = ImmutableMatchLayer.class)
public abstract class MatchLayer extends FilterPredicate {
    public abstract Layer.ID getLayer();

    @Override
    public Predicate querydslPredicate(QTokensEntity tokens) {
        return tokens.layer.primaryKey.eq(getLayer().ordinal());
    }

}
