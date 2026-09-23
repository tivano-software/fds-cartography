/* © 2022 Tivano Software GmbH */
package ch.unibe.germanistik.namenatlas.query;

import java.util.Arrays;
import java.util.Collection;

import org.immutables.value.Value;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.querydsl.core.types.Predicate;
import com.querydsl.core.types.dsl.StringPath;

import ch.unibe.germanistik.namenatlas.Location;
import ch.unibe.germanistik.namenatlas.Tokens;
import ch.unibe.germanistik.namenatlas.persistence.QLocationEntity;
import ch.unibe.germanistik.namenatlas.persistence.QTokensEntity;
import io.swagger.v3.oas.annotations.media.Schema;

/** Filters {@link Tokens} by matching one of the fields in the associated {@link Location} against {@link #getMatch()}. */
@Schema
@Value.Immutable
@JsonDeserialize(as = ImmutableMatchLocation.class)
public abstract class MatchLocation extends FilterPredicate {

    enum Field { NAME, MUNICIPALITY, DISTRICT, CANTON, COUNTRY }

    public abstract Field getField();
    public abstract String getMatch();

    @Override
    public Predicate querydslPredicate(QTokensEntity tokens) {
        return querydslPath(tokens).in(parsedMatch());
    }

    public final Collection<String> parsedMatch() {
        return Arrays.asList(getMatch().split(",\s*"));
    }

    public final StringPath querydslPath(QTokensEntity tokens) {
        QLocationEntity location = tokens.location;
        switch (getField()) {
            case CANTON:
                return location.canton;
            case COUNTRY:
                return location.country;
            case DISTRICT:
                return location.district;
            case MUNICIPALITY:
                return location.municipality;
            case NAME:
                return location.name;
            default:
                throw new IllegalStateException("Unknown location field " + getField());
        }
    }

}
