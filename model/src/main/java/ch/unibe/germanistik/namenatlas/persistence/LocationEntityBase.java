/* (C) 2021 Tivano Software GmbH */
package ch.unibe.germanistik.namenatlas.persistence;

import org.hibernate.annotations.Immutable;
import org.immutables.value.Value;

import ch.unibe.germanistik.namenatlas.Location;
import jakarta.persistence.Column;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * JPA entity for {@link Location}
 */
@Value.Modifiable @JPAStyle
@Immutable @Table(name = "locations")
abstract interface LocationEntityBase extends Location {
    @Id
    @Override public abstract int getId();

    @Column(nullable = false, insertable = false, updatable = false)
    @Override public abstract String getName();

    @Column(nullable = false, insertable = false, updatable = false)
    @Override public abstract String getMunicipality();

    @Column(nullable = false, insertable = false, updatable = false)
    @Override public abstract String getDistrict();

    @Column(nullable = false, insertable = false, updatable = false)
    @Override public abstract String getCanton();

    @Column(nullable = false, insertable = false, updatable = false)
    @Override public abstract String getCountry();
}
