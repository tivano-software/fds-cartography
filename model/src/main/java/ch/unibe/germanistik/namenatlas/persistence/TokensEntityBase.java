/* (C) 2022 Tivano Software GmbH */
package ch.unibe.germanistik.namenatlas.persistence;

import org.checkerframework.checker.signedness.qual.Unsigned;
import org.hibernate.annotations.Immutable;
import org.immutables.value.Value;

import ch.unibe.germanistik.namenatlas.Layer;
import ch.unibe.germanistik.namenatlas.Location;
import ch.unibe.germanistik.namenatlas.Tokens;
import ch.unibe.germanistik.namenatlas.Type;
import jakarta.persistence.Column;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 * JPA entity for {@link Tokens}
 */
@Value.Modifiable @JPAStyle
@Immutable @Table(name = "tokens")
abstract interface TokensEntityBase extends Tokens {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public abstract int getId();

    @ManyToOne(targetEntity = LayerEntity.class)
    @JoinColumn(name = "layer", columnDefinition = "layer_id")
    @Override abstract public Layer getLayer();

    @ManyToOne(targetEntity = LocationEntity.class)
    @JoinColumn(name = "location")
    @Override abstract public Location getLocation();

    @ManyToOne(targetEntity = TypeEntity.class)
    @JoinColumn(name = "type")
    @Override abstract public Type getType();

    @Column(insertable = false, updatable = false)
    @Override abstract public @Unsigned int getTokens();
}
