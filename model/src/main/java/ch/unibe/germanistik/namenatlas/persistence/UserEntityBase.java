/* (C) 2022 Tivano Software GmbH */
package ch.unibe.germanistik.namenatlas.persistence;

import java.util.Set;

import org.immutables.value.Value;

import ch.unibe.germanistik.namenatlas.ExistingUser;
import ch.unibe.germanistik.namenatlas.User;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Converter;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * JPA entity for {@link User}
 */
@Value.Modifiable @JPAStyle
@Table(name = "users")
abstract interface UserEntityBase extends ExistingUser {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Override public abstract int getId();

    @Column(unique = true, nullable = false)
    @Override public abstract String getEmail();

    @Column(nullable = false, columnDefinition = "user_roles[]")
    @Convert(converter = RoleSetConverter.class)
    @Override public abstract Set<Role> getRoles();

    // Implementation details below

    /** {@link AttributeConverter} for {@link Role} sets. */
    @Converter public static class RoleSetConverter extends EnumSetArrayConverter<Role> {
        public RoleSetConverter() { super(Role.class); }
    }

}
