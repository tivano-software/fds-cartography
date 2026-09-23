/* (C) 2022 Tivano Software GmbH */
package ch.unibe.germanistik.namenatlas.datapreparation;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.FileNotFoundException;
import java.util.Spliterator;
import java.util.Spliterators;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.stream.Stream;
import java.util.stream.StreamSupport;

import org.checkerframework.checker.nullness.qual.Nullable;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.TestInstance.Lifecycle;
import org.junit.jupiter.api.function.Executable;

import ch.unibe.germanistik.namenatlas.Location;
import ch.unibe.germanistik.namenatlas.Tokens;
import ch.unibe.germanistik.namenatlas.datapreparation.TypesTokensBFS.RawBFSData;

/**
 * <h2>Integrity tests for the intermediate {@link Tokens} data imported by
 * {@link TypesTokensBFS}.</h2>
 *
 * <p>
 * These tests are run during the raw data import of the location data only,
 * and check the assumptions we are making about the imported data.
 * </p>
 */
@TestInstance(Lifecycle.PER_CLASS)
@Tag("types-tokens-bfs")
public class TypesTokensBFSTest {
    protected final TypesTokensBFS data;

    public TypesTokensBFSTest() throws FileNotFoundException {
        this.data = TypesTokensBFS.readFromRawData();
    }

    Stream<TypesTokensBFS.RawBFSData> allRawData() {
        Spliterator<RawBFSData> spliterator = Spliterators.spliteratorUnknownSize(data.rawData().iterator(), Spliterator.IMMUTABLE);
        return StreamSupport.stream(spliterator, false);
    }

    Stream<TypesTokensBFS.RawBFSData> bfsOriginCandidates() {
        return allRawData().filter(TypesTokensBFS.RawBFSData::hasValidPlaceOfOrigin);
    }

    private static class TestClosure<T> implements Executable  {
        private final Consumer<T> code;
        private final T argument;

        public TestClosure(Consumer<T> code, T argument) {
            this.code = code;
            this.argument = argument;
        }

        @Override
        public void execute() throws Throwable {
            code.accept(argument);
        }
    }

    protected static <T> Function<T,Executable> asExecutable(Consumer<T> code) {
        return arg -> new TestClosure<>(code, arg);
    }

    @DisplayName("Location exists for ORIGINNAME1/PLACEOFORIGINID1")
    @Test
    public void testLocationExistsForPlaceOfOrigin() {
        assertAll(bfsOriginCandidates().map(asExecutable(entry -> {
                @Nullable Location location = data.locationByOrigin(entry);
                assertTrue(location != null, "locationByOrigin(" + entry + ") != null");
            }))
        );
    }

    @DisplayName("Location exists for REPORTINGMUNICIPALITYID")
    @Test
    public void testLocationExistsForPlaceOfResidence() {
        assertAll(allRawData().map(asExecutable(entry -> {
                @Nullable Location location = data.locationByResidence(entry);
                assertTrue(location != null, "locationByResidence(" + entry + ") != null");
            }))
        );
    }

    @DisplayName("entry has valid RESIDENTPERMIT column")
    @Test
    public void testHasValidResidentPermitColumn() {
        assertAll(allRawData().map(asExecutable(entry -> {
                assertTrue(entry.hasValidResidentPermitColumn(), "RESIDENTPERMIT is valid for " + entry);
            }))
        );
    }

}
