/* © 2022 Tivano Software GmbH */
package ch.unibe.germanistik.namenatlas;

import java.util.Date;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonFormat.Shape;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.deser.std.DateDeserializers.DateDeserializer;

/** Represents metadata about the author/editor of an object. */
public interface EditorMetadata  {
    public ExistingUser getInitialAuthor();
    public ExistingUser getLastEditor();

    @JsonDeserialize(using = DateDeserializer.class)
    @JsonFormat(shape = Shape.STRING)
    public Date getCreatedAt();

    @JsonDeserialize(using = DateDeserializer.class)
    @JsonFormat(shape = Shape.STRING)
    public Date getLastEditedAt();
}
