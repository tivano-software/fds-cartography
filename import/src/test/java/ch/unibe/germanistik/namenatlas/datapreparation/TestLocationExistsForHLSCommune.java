package ch.unibe.germanistik.namenatlas.datapreparation;

import static org.junit.jupiter.api.Assertions.assertEquals;
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
public class TestLocationExistsForHLSCommune extends TypesTokensHLSTest {
    @DisplayName("Location exists for COMMUNE")
    @ParameterizedTest(name = "{0}")
    @MethodSource("hlsCommuneCandidates")
    public void test(TypesTokensHLS.RawHLSData raw) {
        @Nullable Location location = data.locationByCommune(raw);
        assertTrue(location != null, "locationByCommune(" + raw + ") is null");
        assert location != null : "@AssumeAssertion(nullness) - guaranteed by the assertTrue(location != null) above";
        assertTrue(raw.canton != null, "Invalid raw data: " + raw);
        assert raw.canton != null : "@AssumeAssertion(nullness) - guaranteed by the assertTrue(raw.canton != null) above";

        // Some places of origin changed cantons over the years - accord for these exceptions
        // See resources/raw-data/eCH-0135_Code_Heimatorte.csv for details
        String expectedCanton;
        switch (raw.commune + ":" + raw.canton) {
            case "Blauen:BE":
            case "Brislach:BE":
            case "Burg im Leimental:BE":
            case "Dittingen:BE":
            case "Duggingen:BE":
            case "Grellingen:BE":
            case "Laufen:BE":
            case "Liesberg:BE":
            case "Nenzlingen:BE":
            case "Roggenburg:BE":
            case "Röschenz:BE":
            case "Zwingen:BE":
            case "Laufen Vorstadt:BE":
            case "Wahlen:BE":
                expectedCanton = "BL";
                break;

            case "Vellerat:BE":
                expectedCanton = "JU";
                break;

            case "Clavaleyres:BE":
                expectedCanton = "FR";
                break;

            default:
                expectedCanton = raw.canton;
                break;
        }

        assertEquals(expectedCanton, location.getCanton(), "Canton in location " + location + " does not match the expected canton " + expectedCanton + " for " + raw);
    }
}