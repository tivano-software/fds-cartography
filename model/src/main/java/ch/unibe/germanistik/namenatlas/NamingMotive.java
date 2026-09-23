/* (C) 2021 Tivano Software GmbH */
package ch.unibe.germanistik.namenatlas;

/**
 * Naming motive for a {@link Type}
 *
 * <p>The set of categories defined here corresponds to the naming motive
 * categorization scheme used by {@link DataProvider#ETDB}.</p>
 *
 */
public enum NamingMotive {
    ORIGIN_NAME,
    RESIDENCE_NAME,
    OCCUPATION_NAME,
    OCCUPATION_SOBRIQUET,
    SOBRIQUET,
    PATRONYM,
    METRONYM,
    OTHER_OR_MIXED,
    PROBLEMATIC_NAME
}
