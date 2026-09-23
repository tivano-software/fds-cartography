/* © 2022 Tivano Software GmbH */
package ch.unibe.germanistik.namenatlas.query;

import java.io.IOException;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonProperty.Access;
import com.fasterxml.jackson.core.JacksonException;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.ObjectCodec;
import com.fasterxml.jackson.core.filter.TokenFilter;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.deser.std.StdDeserializer;
import com.fasterxml.jackson.databind.exc.InvalidTypeIdException;
import com.querydsl.core.types.Predicate;

import ch.unibe.germanistik.namenatlas.Tokens;
import ch.unibe.germanistik.namenatlas.persistence.QTokensEntity;
import io.swagger.v3.jaxrs2.ReaderListener;
import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.media.Schema.AccessMode;
import io.swagger.v3.oas.integration.api.OpenApiReader;
import io.swagger.v3.oas.models.OpenAPI;

/**
 * Generic toplevel type to filter {@link Tokens} by various criteria.
 */
@Schema(
    oneOf = {
        // Boolean operations to combine filters
        MatchNot.class, MatchAny.class, MatchAll.class,

        // Simple filters on {@link Type}
        MatchTypesRegexp.class, MatchTypesDescriptionRegexp.class,
        MatchLanguageCategory.class, MatchNamingMotive.class,

        // Simple filters on {@link Location}
        MatchLocation.class,

        // Simple filters on {@link Layer}
        MatchLayer.class,

        // Combined filters
        MatchSameTypeAs.class, MatchSameLocationAs.class
    },
    discriminatorProperty = "operation"
)
@JsonDeserialize(using = FilterPredicate.JsonDeserializer.class)
public abstract class FilterPredicate {

    public static final QTokensEntity TOKENS_ROOT = QTokensEntity.tokensEntity;

    // Access has to be read-write on the OpenAPI level (because the client needs
    // to set the discriminator in incoming data), but must be read-only for the JSON-to-Java
    // conversion (because there is no setter for this property)
    @Schema(accessMode = AccessMode.READ_WRITE, required = true)
    @JsonProperty(access = Access.READ_ONLY)
    public final String getOperation() {
        // Make sure we use the correct name for subclasses defined in @Schema(oneOf = {...})
        Class<?> concreteType = getClass();
        Schema schemaAnnotation = FilterPredicate.class.getAnnotation(Schema.class);
        if (schemaAnnotation != null) {
            for (Class<?> definedType : schemaAnnotation.oneOf()) {
                if (definedType.isAssignableFrom(concreteType)) {
                    return definedType.getSimpleName();
                }
            }
        }
        // Default to the simple class name if not found
        return concreteType.getName();
    }

    /**
     * Helper class as workaround for https://github.com/swagger-api/swagger-ui/issues/3325.
     *
     * Declares a generic variant of the {@link TokenFilter} OpenAPI schema that avoids
     * recursive definition.
     *
     * Only intended use is in a schema declaration like
     * {@code @Schema(implementation = FilterPredicate.SwaggerUIBugWorkaround.class)} and
     * as a swagger-core {@link ReaderListener} to automatically fix the generated OpenAPI.
     */
    @Schema(
        name = "FilterPredicateGeneric",
        title = "FilterPredicate (generic)",
        description = "See the `FilterPredicate` schema for the full definition."
    )
    @OpenAPIDefinition
    public static final class SwaggerUIBugWorkaround implements ReaderListener {
        @Schema(required = true) public final String operation = "";

        @Override
        public void beforeScan(OpenApiReader reader, OpenAPI openAPI) {}

        @Override
        public void afterScan(OpenApiReader reader, OpenAPI openAPI) {
            // Fix the OpenAPI definition for the SwaggerUIBugWorkaround.class to allow
            // arbitrary additional properties
            String schemaName = getClass().getSimpleName();
            Schema schemaAnnotation = getClass().getAnnotation(Schema.class);
            if (schemaAnnotation != null && !schemaAnnotation.name().isBlank()) {
                schemaName = schemaAnnotation.name();
            }
            io.swagger.v3.oas.models.media.Schema<?> schema = openAPI
                .getComponents()
                .getSchemas()
                .get(schemaName);
            assert schema != null : "@AssumeAssertion(nullness) - expected to find a schema entry for " + schemaName;
            schema.setAdditionalProperties(true);
        }
    }

    /**
     * Custom JSON deserializer for {@link FilterPredicate}.
     *
     * Uses the value from the {@link Schema#discriminatorProperty()} to resolve the concrete type
     * of one of the types enumerated in {@link Schema#oneOf()}.
     *
     * The deserializer assumes that the value of the discriminator is the simple class name
     * of the Java type.
     */
    public static class JsonDeserializer extends StdDeserializer<FilterPredicate> {

        private final String discriminatorProperty;
        private final Map<String,Class<? extends FilterPredicate>> subtypes;

        public JsonDeserializer() {
            super(FilterPredicate.class);
            Schema schemaAnnotation = FilterPredicate.class.getAnnotation(Schema.class);
            assert schemaAnnotation != null : "@AssumeAssertion(nullness) - " + FilterPredicate.class.getName() + " must have a @Schema annotation";
            String discriminatorProperty = schemaAnnotation.discriminatorProperty();
            assert discriminatorProperty != null : "@AssumeAssertion(nullness) - @Schema.discriminatorProperty must be defined for " + FilterPredicate.class.getName();
            this.discriminatorProperty = discriminatorProperty;
            Map<String,Class<? extends FilterPredicate>> subtypes = new HashMap<>();
            for (Class<?> subtype : schemaAnnotation.oneOf()) {
                assert FilterPredicate.class.isAssignableFrom(subtype) : "Classes in @Schema.oneOf() must be subclasses of " + FilterPredicate.class.getName();
                subtypes.put(subtype.getSimpleName(), subtype.asSubclass(FilterPredicate.class));
            }
            this.subtypes = Collections.unmodifiableMap(subtypes);
        }

        @Override
        public FilterPredicate deserialize(JsonParser jp, DeserializationContext ctxt)
                throws IOException, JacksonException
        {
            ObjectCodec oc = jp.getCodec();
            JsonNode node = oc.readTree(jp);
            String schemaName = node.get(discriminatorProperty).asText();
            Class<? extends FilterPredicate> subtype = subtypes.get(schemaName);
            if (subtype == null) {
                String msg = "'" + schemaName + "' is not a valid schema ID for FilterPredicate";
                throw InvalidTypeIdException.from(ctxt, msg);
            }
            JsonParser nodeParser = node.traverse(oc);
            return nodeParser.readValueAs(subtype);
        }

    }

    /**
     * Get the QueryDSL tokens predicate for this filter.
     */
    public abstract Predicate querydslPredicate(QTokensEntity tokens);


}
