/* © 2022 Tivano Software GmbH */
package ch.unibe.germanistik.namenatlas.persistence;

import org.checkerframework.checker.nullness.qual.Nullable;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.immutables.value.Value;

import ch.unibe.germanistik.namenatlas.query.ExistingNamedFilter;
import ch.unibe.germanistik.namenatlas.query.FilterPredicate;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Converter;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Value.Modifiable @JPAStyle
@Table(name = "filters")
interface NamedFilterEntityBase extends ExistingNamedFilter, EditorMetadataEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Override public int getId();

    @Column(unique = true, nullable = false)
    @Override public String getName();

    @Column(unique = true, nullable = false)
    @Override public abstract boolean isEditable();

    @Column(nullable = false)
    @JdbcTypeCode(SqlTypes.JSON)
    @Convert(converter = TokensFilterJsonConverter.class)
    @Override public FilterPredicate getFilter();

    @Column(unique = true, nullable = true)
    @Override @Nullable public abstract String getDescription();

    // Implementation details below

    /** {@link AttributeConverter} for {@link FilterPredicate} objects. */
    @Converter public static class TokensFilterJsonConverter extends JsonConverter<FilterPredicate> {
        public TokensFilterJsonConverter() { super(FilterPredicate.class); }
    }

}
