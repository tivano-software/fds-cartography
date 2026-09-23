/* © 2022 Tivano Software GmbH */
package ch.unibe.germanistik.namenatlas;

import java.util.Set;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;

import org.immutables.value.Value;

/** A user of the software */
@Value.Immutable
@JsonDeserialize(as = ImmutableUser.class)
public interface User {
    /** User role for access control purposes." */
    enum Role { USER,  ADMIN }

    /** "The email address of the user. Can be used as a unique identifier. */
    String getEmail();

    /** The roles for this user (used for access control) */
    Set<Role> getRoles();
}
