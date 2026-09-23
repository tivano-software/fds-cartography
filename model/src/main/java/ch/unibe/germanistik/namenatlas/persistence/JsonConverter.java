/* (C) 2022 Tivano Software GmbH */
package ch.unibe.germanistik.namenatlas.persistence;

import org.checkerframework.checker.nullness.qual.Nullable;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.persistence.AttributeConverter;

/**
 * Converts between arbitrary types and {@link String} in order
 * to store an object as JSON in an appropriate database column.
 *
 * <p>To use this in JPA, derive a concrete, non-generic sub class for each
 * type that should be converted. Example:</p>
 *
 * <pre>
 * &#x40;Converter(autoApply = true)
 * public class ExampleJsonConverter extends JsonNodeConverter&lt;Example&gt; {
 *      public ExampleJsonConverter() { super(Example.class); }
 * }
 * </pre>
 *
 * <p>
 * Use case for this converter is storing Java objects as PostgreSQL
 * "json" or "jsonb" data.
 * </p>
 */
public abstract class JsonConverter<T> implements AttributeConverter<@Nullable T, @Nullable String> {
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private final Class<T> elementType;

    public JsonConverter(Class<T> elementType) {
        this.elementType = elementType;
    }

    @Override
    public @Nullable String convertToDatabaseColumn(@Nullable T attribute) {
        try {
            return attribute == null ? null : OBJECT_MAPPER.writeValueAsString(attribute);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException(e);
        }
    }

    @Override
    public @Nullable T convertToEntityAttribute(@Nullable String dbData) {
        try {
            return dbData == null ? null : OBJECT_MAPPER.readValue(dbData, elementType);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException(e);
        }
    }
}
