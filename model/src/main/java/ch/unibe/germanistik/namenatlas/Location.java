/* (C) 2021 Tivano Software GmbH */
package ch.unibe.germanistik.namenatlas;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;

import org.immutables.value.Value;

/**
 * The geographic location associated with {@link Tokens}
 *
 * <p>Each location corresponds either to an entry in the
 * <a href="https://www.swisstopo.admin.ch/en/geodata/official-geographic-directories%20/directory-towns-cities.html">official
 * directory of towns and cities</a> ("swiss location"), or represents a neighbour country of Switzerland ("foreign location").</p>
 *
 * <p>Most locations are swiss locations, foreign locations are only used for tokens with {@link Layer}
 * {@link Layer.ID#HLS_ORIGIN}, where they denote the country of origin of people whith the
 * corresponding name who immigrated to Switzerland before 1900.</p>
 */
@Value.Immutable
@JsonDeserialize(as = ImmutableLocation.class)
public interface Location {

    public enum Level { NAME, MUNICIPALITY, DISTRICT, CANTON, COUNTRY}

    /**
     * Unique internal ID.
     */
    int getId();

    /**
     * The name of the location.
     *
     * The official form of the
     * <a href="https://www.swisstopo.admin.ch/en/geodata/official-geographic-directories%20/directory-towns-cities.html">locality name</a>
     * name for domestic locations, and the name of the country (in this countrys native language) for foreign
     * locations.
     */
    String getName();

    /**
     * The municipality this location belongs to.
     *
     * For foreign locations, this is empty.
     */
    String getMunicipality();

    /**
     * The district name of the municipality.
     *
     * For foreign locations, this is empty.
     */
    String getDistrict();

    /**
     * The canton ID of the municipality.
     *
     * For foreign locations, this is empty.
     */
    String getCanton();

    /**
     * The two-letter ISO-3166 country code of the location.
     *
     * For domestic locations, this is always "CH".
     */
    String getCountry();
}
