/* © 2022 Tivano Software GmbH */
package ch.unibe.germanistik.namenatlas.persistence;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.immutables.value.Value;

import ch.unibe.germanistik.namenatlas.config.ExistingConfiguration;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Converter;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Value.Modifiable @JPAStyle
@Table(name = "config_data")
public interface ConfigurationEntityBase extends ExistingConfiguration, EditorMetadataEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Override public int getId();

    @Column(unique = true, nullable = false)
    @Override public String getName();

    @Column(nullable = false)
    @JdbcTypeCode(SqlTypes.JSON)
    @Convert(converter = ConfigDataJsonConverter.class)
    @Override public Object getData();

    // Implementation details below

    /** {@link AttributeConverter} for {@link Object} objects. */
    @Converter public static class ConfigDataJsonConverter extends JsonConverter<Object> {
        public ConfigDataJsonConverter() { super(Object.class); }
    }


}
