/* (C) 2022 Tivano Software GmbH */
package ch.unibe.germanistik.namenatlas.datapreparation;

import java.util.stream.Stream;

import ch.unibe.germanistik.namenatlas.Tokens;

/**
 * <h2>Integrity tests for the intermediate {@link Tokens} data imported by
 * {@link TypesTokensHLS}.</h2>
 *
 * <p>
 * These tests are run during the raw data import of the location data only,
 * and check the assumptions we are making about the imported data.
 * </p>
 */
public abstract class TypesTokensHLSTest {
    protected final TypesTokensHLS data;

    public TypesTokensHLSTest() {
        this.data = TypesTokensHLS.readFromRawData();
    }

    Stream<TypesTokensHLS.RawHLSData> allRawData() {
        return data.rawData.stream();
    }

    Stream<TypesTokensHLS.RawHLSData> hlsOriginCandidates() {
        return allRawData().filter(data::isHLSOriginCandidate);
    }

    Stream<TypesTokensHLS.RawHLSData> hlsCommuneCandidates() {
        return allRawData().filter(data::isHLSCommuneCandidate);
    }

}
