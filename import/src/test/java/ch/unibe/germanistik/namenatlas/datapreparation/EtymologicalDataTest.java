/* (C) 2022 Tivano Software GmbH */
package ch.unibe.germanistik.namenatlas.datapreparation;

import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.stream.Stream;

import org.checkerframework.checker.nullness.qual.KeyFor;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.TestInstance.Lifecycle;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;

/**
 * <h2>Integrity tests for the etymological data data imported by
 * {@link EtymologicalData}.</h2>
 *
 * <p>
 * These tests are run during the raw data import of the location data only,
 * and check the assumptions we are making about the imported data.
 * </p>
 */
@TestInstance(Lifecycle.PER_CLASS)
@Tag("etdb-import")
public class EtymologicalDataTest {

    private final EtymologicalData etdbData;
    private final Types types;

    public EtymologicalDataTest() {
        this.etdbData = EtymologicalData.readFromRawData();
        this.types = Types.readFromIntermediateData();
    }

    @DisplayName("All types in the ET-DB data have a corresponding type in the final FDS data")
    @ParameterizedTest(name = "{0}")
    @MethodSource("allTypesFromETDB")
    public void testNameIsFound(String name) {
        assertTrue(types.get(name) != null, "no entry found in Types for " + name);
    }

    Stream<@KeyFor("this.etdbData.typesByName") String> allTypesFromETDB() {
        return etdbData.typesByName.keySet().stream();
    }
}
