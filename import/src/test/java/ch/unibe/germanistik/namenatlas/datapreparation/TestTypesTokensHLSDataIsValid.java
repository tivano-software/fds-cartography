package ch.unibe.germanistik.namenatlas.datapreparation;

import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.TestInstance.Lifecycle;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;

@TestInstance(Lifecycle.PER_CLASS)
@Tag("types-tokens-hls")
public class TestTypesTokensHLSDataIsValid extends TypesTokensHLSTest {
    @DisplayName("Tokens data is valid")
    @ParameterizedTest(name = "{0}")
    @MethodSource("allRawData")
    public void test(TypesTokensHLS.RawHLSData raw) {
        assertTrue(raw.isValid(), "invalid data found: " + raw);
    }
}