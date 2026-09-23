/* (C) 2022 Tivano Software GmbH */
package ch.unibe.germanistik.namenatlas.persistence;

import java.util.EnumSet;
import java.util.Set;

import org.checkerframework.checker.nullness.qual.Nullable;

import jakarta.persistence.AttributeConverter;

/**
 * Converts between {@link EnumSet} and {@link String[]} in order
 * to store a set of enum values in a PostgreSQL array.
 *
 * <p>To use this in JPA, derive a concrete, non-generic sub class for each
 * enum type that should be converted. Example:</p>
 *
 * <pre>
 * public enum State { OK, ERROR }
 *
 * &#x40;Converter(autoApply = true)
 * public class StateSetArrayConverter extends EnumSetArrayConverter&lt;State&gt; {
 *      public StateSetArrayConverter() { super(State.class); }
 * }
 * </pre>
 *
 * <p>
 * Use case for this converter is storing Java enum sets as PostgreSQL
 * arrays of a corresponding enum type, and the converter assumes that
 * <code>String[]</code> will be converted to the appropriate enum array type.
 * </p>
 */
public abstract class EnumSetArrayConverter<E extends Enum<E>> implements AttributeConverter<Set<E>, String[]> {

    private final Class<E> elementType;

    protected EnumSetArrayConverter(Class<E> elementType) {
        this.elementType = elementType;
    }

    @Override
    public final String[] convertToDatabaseColumn(Set<E> values) {
        return values.stream().map(Enum::name).toArray(String[]::new);
    }

    @Override
    public final Set<E> convertToEntityAttribute(String[] dbData) {
        EnumSet<E> result = EnumSet.noneOf(elementType);
        for (@Nullable String value : dbData) {
            if (value != null && !value.isBlank()) {
                result.add(Enum.valueOf(elementType, value.trim()));
            }
        }
        return result;
    }
}
