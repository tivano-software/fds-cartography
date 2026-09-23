/* (C) 2021 Tivano Software GmbH */
package ch.unibe.germanistik.namenatlas;

/** Identifiers for the different data providers for {@link Type} and {@link Tokens} data */
public enum DataProvider {

    /** Data provided by the <a href="https://www.bfs.admin.ch/bfs/en/home.html">Federal Statistics Office</a>. */
    BFS,

    /** Data provided by the <a href="https://hls-dhs-dss.ch/famn?lg=e">Register of Swiss Surnames</a>. */
    HLS_FAM,

    /** Data provided by the <a href="https://www.familiennamen.nicoledidi.ch/werkstatt">"Etymologische Datenbank"</a>. */
    ETDB,

    /** Example data for the {@link Layer.ID#TEST_A} and {@link Layer.ID#TEST_B} layers. */
    EXAMPLE,

}
