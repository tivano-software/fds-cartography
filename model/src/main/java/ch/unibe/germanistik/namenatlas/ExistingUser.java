/* © 2022 Tivano Software GmbH */
package ch.unibe.germanistik.namenatlas;

/** A {@link User} entry that has an existing database representation. */
public interface ExistingUser extends User {
    /** The internal ID of this user entry in the database. */
    int getId();
}
