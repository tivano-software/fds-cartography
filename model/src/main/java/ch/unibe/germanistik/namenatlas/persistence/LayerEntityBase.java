/* (C) 2022 Tivano Software GmbH */
package ch.unibe.germanistik.namenatlas.persistence;

import org.hibernate.annotations.Immutable;
import org.immutables.value.Value;

import ch.unibe.germanistik.namenatlas.Layer;
import jakarta.persistence.Column;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * JPA entity for {@link Layer}
 */
@Value.Modifiable @JPAStyle
@Immutable @Table(name = "layers")
abstract interface LayerEntityBase extends Layer {
    // Note: Using an enum as primary key does not work well in Hibernate/QueryDSL.
    // For this reason, we use the ordinal() of the ID as actual primary key
    @Id
    @Column(name = "id")
    public int getPrimaryKey();

    @Override default ID getId() { return Layer.ID.values()[getPrimaryKey()]; }



    @Column(unique = true, nullable = false, insertable = false, updatable = false)
    @Override abstract public String getName();

    @Column(nullable = false, insertable = false, updatable = false)
    @Override abstract public String getDescription();
}
