/* © 2022 Tivano Software GmbH */
package ch.unibe.germanistik.namenatlas.query;

import ch.unibe.germanistik.namenatlas.EditorMetadata;

/** A {@link NamedFilter} that has an existing database representation. */
public interface ExistingNamedFilter extends NamedFilter, EditorMetadata {
    public int getId();
}
