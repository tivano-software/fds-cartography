/* (C) 2021 Tivano Software GmbH */
package ch.unibe.germanistik.namenatlas;

/**
 * Language category for a {@link Type}
 *
 * <p>The set of categories defined here corresponds to the language
 * categorization scheme used by {@link DataProvider#ETDB}.</p>
 *
 * <p>The naming scheme used for the individual enum values follows
 * <a href="https://iso639-3.sil.org/">ISO-693</a> as closely as possible.
 * For categories in {@link DataProvider#ETDB} that consists of several languages,
 * the ISO-639 codes of the individual languages in that category are separated
 * by <code>_</code> (for example, {@link #GRC_LAT} for greek/latin).</p>
 */
public enum LanguageCategory {
    GEM_DEU,
    ROH,
    ITA,
    FRA,
    GRC_LAT,

    UNKNOWN,
    OTHER
}
