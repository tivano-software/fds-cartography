/* (C) 2022 Tivano Software GmbH */
package ch.unibe.germanistik.namenatlas.datapreparation;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.stream.Stream;

import org.checkerframework.checker.nullness.qual.Nullable;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.TestInstance.Lifecycle;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;

import ch.unibe.germanistik.namenatlas.Location;

/**
 * <h2>Integrity tests for the {@link Location} data imported by
 * {@link Locations}.</h2>
 *
 * <p>
 * These tests are run during the raw data import of the location data only,
 * and check the assumptions we are making about the imported data.
 * </p>
 */
@TestInstance(Lifecycle.PER_CLASS)
@Tag("locations")
public class LocationsTest {

    private final Locations data;

    public LocationsTest() {
        this.data = Locations.readFromRawData();
    }

    @DisplayName("All PLZO_CSV_LV95 entries are mapped")
    @ParameterizedTest(name = "{0}")
    @MethodSource("allLPLZONames")
    public void testPLZONameHasLocation(String name) {
        assertTrue(data.byName(name) != null, "no entry found in Locations.byName() for " + name);
    }

    @DisplayName("Location name is unique")
    @ParameterizedTest(name = "{0}")
    @MethodSource("allLocations")
    public void testLocationNameIsUnique(Location expected) {
        @Nullable Location actual =  data.byName(expected.getName());
        assert actual != null : "@AssumeAssertion(nullness) - location not found";
        assertEquals(expected, actual);
    }

    @DisplayName("Location ID is unique")
    @ParameterizedTest(name = "{0}")
    @MethodSource("allLocations")
    public void testLocationIDIsUnique(Location expected) {
        @Nullable Location actual =  data.byID(expected.getId());
        assert actual != null : "@AssumeAssertion(nullness) - location not found";
        assertEquals(expected, actual);
    }

    Stream<String> allLPLZONames() {
        return data.plzoLocations.stream().map(entry -> entry.name);
    }
    Stream<Location> allLocations() {
        return data.all();
    }
}
