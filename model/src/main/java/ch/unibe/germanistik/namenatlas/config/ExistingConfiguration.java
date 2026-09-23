/* © 2022 Tivano Software GmbH */
package ch.unibe.germanistik.namenatlas.config;

import ch.unibe.germanistik.namenatlas.EditorMetadata;

/** A {@link Configuration} object as persisted in the database. */
public interface ExistingConfiguration extends Configuration, EditorMetadata {
    public int getId();
}
