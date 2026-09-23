/* © 2022 Tivano Software GmbH */
package ch.unibe.germanistik.namenatlas;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import org.immutables.value.Value;

/**
 * Annotation style for generating value objects from an abstract base class
 * with {@link Value.Immutable}.
 */

@Target({ElementType.TYPE, ElementType.PACKAGE})
@Retention(RetentionPolicy.CLASS) // Use class retention for incremental compilation
@Value.Style(
    init = "with*",
    get = {"get*", "is*" }
)
public @interface ValueObjectStyle {}
