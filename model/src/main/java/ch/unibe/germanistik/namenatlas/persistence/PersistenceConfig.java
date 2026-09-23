package ch.unibe.germanistik.namenatlas.persistence;

/** Helper class providing constants for type safe access to configuration values */
public class PersistenceConfig {
    // Keep in sync with the persistence unit name in persistence.xml!
    public static final String PERSISTENCE_UNIT = PersistenceConfig.class.getPackageName();
}
