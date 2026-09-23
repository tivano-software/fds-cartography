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
public class TestHLSBourgColumnIsValid extends TypesTokensHLSTest {
    @DisplayName("The BOURG column is either empty or a comma separated list of numbers")
    @ParameterizedTest(name = "{0}")
    @MethodSource("allRawData")
    public void test(TypesTokensHLS.RawHLSData raw) {
        assertTrue(raw.bourg.isBlank() || raw.bourg.matches("[0-9,\\s]+"), "invalid data found: " + raw);
    }
}