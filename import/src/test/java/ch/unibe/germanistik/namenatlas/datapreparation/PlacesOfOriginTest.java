/* (C) 2022 Tivano Software GmbH */
package ch.unibe.germanistik.namenatlas.datapreparation;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.checkerframework.checker.nullness.qual.Nullable;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.TestInstance.Lifecycle;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;

import ch.unibe.germanistik.namenatlas.Location;
import ch.unibe.germanistik.namenatlas.datapreparation.PlacesOfOrigin.PlaceOfOrigin;
import ch.unibe.germanistik.namenatlas.datapreparation.PlacesOfOrigin.PlaceOfOriginWithLocation;

/**
 * <h2>Integrity tests for the {@link PlaceOfOrigin} data imported by
 * {@link PlacesOfOrigin}.</h2>
 *
 * <p>
 * These tests are run during the raw data import of the location data only,
 * and check the assumptions we are making about the imported data.
 * </p>
 */
@TestInstance(Lifecycle.PER_CLASS)
@Tag("locations")
public class PlacesOfOriginTest {

    private final PlacesOfOrigin data;

    public PlacesOfOriginTest() {
        this.data = PlacesOfOrigin.readFromRawData();
    }

    @DisplayName("all PlaceOfOrigin entries with successorID != null have an immediate successor entry with either successorID == null or a different successor id, and all places of origin with successorID == null are their own immediate successor")
    @ParameterizedTest(name = "{0}")
    @MethodSource("rawPlacesOfOriginWithSucessor")
    public void testValidSucessorID(PlaceOfOrigin place) {
        PlaceOfOrigin successor = data.immediateSuccessor(place);
        if (place.successorID == null) {
            assertEquals(place, successor, "Expected successor to be the same as place of origin for " + place);
        } else {
            assertNotEquals(place, successor, "Expected successor to be different from place of origin for " + place);
            if (successor.successorID != null) {
                assertNotEquals(place.successorID, successor.successorID, "Expected place.successorID to be different than successor.successorID");
            }
        }
    }

    @DisplayName("the placeOfOrigin ID is unique for all PlaceOfOrigin entries without a successorID")
    @ParameterizedTest(name = "{0}")
    @MethodSource("rawPlacesOfOriginWithoutSucessor")
    public void testPlaceOfOriginWitoutSucessorHasUniqueID(PlaceOfOrigin place) {
        PlaceOfOrigin successor = data.immediateSuccessor(place);
        if (place.successorID == null) {
            assertEquals(place, successor, "Expected successor to be the same as place of origin for " + place);
        } else {
            assertNotEquals(place, successor, "Expected successor to be different from place of origin for " + place);
            if (successor.successorID != null) {
                assertNotEquals(place.successorID, successor.successorID, "Expected place.successorID to be different than successor.successorID");
            }
        }
    }

    @DisplayName("all PlaceOfOrigin entries are mapped to a location")
    public void testAllPlacesOfOriginHaveLocation() {
        assertEquals(data.rawPlacesOfOrigin.size(), data.placesOfOrigin.size());
        Set<String> placeOfOriginKeys = data.placesOfOrigin.stream()
            .map(place -> place.key())
            .collect(Collectors.toUnmodifiableSet());
        data.rawPlacesOfOrigin.stream().forEach(place -> {
            assertTrue(placeOfOriginKeys.contains(place.key()), "No mapped location found for place of origin " + place);
        });
    }

    @DisplayName("the mapped location for a place of origin can be looked up by placeOfOriginName and the placeOfOriginID of its final successor")
    @ParameterizedTest(name = "{0}")
    @MethodSource("allMappedPlacesOfOrigin")
    public void testPlaceOfOriginHasLocationByNameAndFinalSuccessorID(PlaceOfOriginWithLocation place) {
        @Nullable Location expected = data.locations.byName(place.location);
        assert expected != null : "@AssumeAssertion(nullness) - place.location is a valid location name: " + place;

        PlaceOfOrigin finalSuccessor = data.finalSuccessor(place);
        @Nullable Location loc = data.locationForPlaceOfOriginNameAndFinalSuccessorID(place.placeOfOriginName, finalSuccessor.placeOfOriginID);
        assertTrue(loc != null, "No location by ID found for " + place);
        assert loc != null : "@AssumeAssertion(nullness) - guaranteed by assertTrue(loc != null) above";
        assertEquals(expected, loc, "Wrong location found for " + place);
    }

    @DisplayName("the mapped location for a place of origin can be looked up by placeOfOriginName and canton")
    @ParameterizedTest(name = "{0}")
    @MethodSource("allMappedPlacesOfOrigin")
    public void testPlaceOfOriginHasLocationByNameAndCanton(PlaceOfOriginWithLocation place) {
        @Nullable Location loc = data.locationForPlaceOfOriginNameAndCanton(place.placeOfOriginName, place.placeOfOriginCanton);
        @Nullable Location expected = data.locations.byName(place.location);
        assert expected != null : "@AssumeAssertion(nullness) - place.location is a valid location name:" + place;
        assertTrue(loc != null, "No location by ID found for " + place);
        assert loc != null : "@AssumeAssertion(nullness) - guaranteed by assertTrue(loc != null) above";
        assertEquals(expected, loc, "Wrong location found for " + place);
    }

    Stream<PlaceOfOriginWithLocation> allMappedPlacesOfOrigin() {
        return data.placesOfOrigin.stream();
    }
    Stream<PlaceOfOrigin> rawPlacesOfOriginWithSucessor() {
        return data.rawPlacesOfOrigin.stream().filter(place -> place.successorID != null);
    }
    Stream<PlaceOfOrigin> rawPlacesOfOriginWithoutSucessor() {
        return data.rawPlacesOfOrigin.stream().filter(place -> place.successorID == null);
    }
}
