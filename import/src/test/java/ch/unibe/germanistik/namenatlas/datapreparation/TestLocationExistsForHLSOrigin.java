package ch.unibe.germanistik.namenatlas.datapreparation;

import static org.junit.jupiter.api.Assertions.assertTrue;

import org.checkerframework.checker.nullness.qual.Nullable;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.TestInstance.Lifecycle;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;

import ch.unibe.germanistik.namenatlas.Location;

@TestInstance(Lifecycle.PER_CLASS)
@Tag("types-tokens-hls")
public class TestLocationExistsForHLSOrigin extends TypesTokensHLSTest {
    @DisplayName("Location exists for ORIGIN")
    @ParameterizedTest(name = "{0}")
    @MethodSource("hlsOriginCandidates")
    public void testLocationExistsForOrigin(TypesTokensHLS.RawHLSData raw) {
        @Nullable Location location = data.locationByOrigin(raw);
        assertTrue(location != null, "locationByOrigin(" + raw + ") is null");
        assert location != null : "@AssumeAssertion(nullness)";
    }

}