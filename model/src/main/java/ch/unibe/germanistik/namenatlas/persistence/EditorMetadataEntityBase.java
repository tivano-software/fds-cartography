/* © 2022 Tivano Software GmbH */
package ch.unibe.germanistik.namenatlas.persistence;

import java.util.Date;

import ch.unibe.germanistik.namenatlas.EditorMetadata;
import ch.unibe.germanistik.namenatlas.ExistingUser;
import jakarta.persistence.Column;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

public interface EditorMetadataEntityBase extends EditorMetadata {
    @ManyToOne(targetEntity = UserEntity.class)
    @JoinColumn(name = "initial_author")
    @Override public ExistingUser getInitialAuthor();

    @ManyToOne(targetEntity = UserEntity.class)
    @JoinColumn(name = "last_editor")
    @Override public ExistingUser getLastEditor();

    @Column(nullable = false, name = "created_at")
    @Override public Date getCreatedAt();

    @Column(nullable = false, name="last_edited_at")
    @Override public Date getLastEditedAt();

}
