package ch.unibe.germanistik.namenatlas.persistence;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import org.hibernate.annotations.Immutable;
import org.hibernate.annotations.JavaType;
import org.hibernate.annotations.JdbcType;
import org.hibernate.annotations.JdbcTypeCode;
import org.immutables.annotate.InjectAnnotation;
import org.immutables.annotate.InjectAnnotation.Where;
import org.immutables.value.Value;
import org.immutables.value.Value.Style.ImplementationVisibility;
import org.immutables.value.Value.Style.ValidationMethod;

import jakarta.persistence.Access;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;

/**
 * Annotation style for generating a JPA entity from an abstract base class
 * with {@link Value.Modifiable}.
 */
@Target({ElementType.TYPE, ElementType.PACKAGE})
@Retention(RetentionPolicy.CLASS) // Use class retention for incremental compilation
@Value.Style(
    typeAbstract = {"Base*", "Abstract*", "*Base", "*Abstract" },
    typeModifiable = "*",
    visibility = ImplementationVisibility.PUBLIC,
    beanFriendlyModifiables = true,
    create = "new",
    depluralize = true,
    get = {"is*", "get*"},
    isInitialized = "initialized",
    builtinContainerAttributes = false,
    validationMethod = ValidationMethod.NONE,
    deepImmutablesDetection = true,
    // TODO: Add all missing JPA annotations
    // Sole exception here is entity.class, @Entity is injected automatically
    // at the TYPE level.
    passAnnotations = {
        // TYPE level JPA
        Table.class, Entity.class, Access.class,
        // FIELD/METHOD level JPA
        Id.class, OneToMany.class, ManyToOne.class, Column.class,
        Convert.class, GeneratedValue.class, Transient.class, JoinColumn.class,
        Enumerated.class,
        // Hibernate
        Immutable.class, JdbcType.class, JdbcTypeCode.class, JavaType.class
    }
)
@InjectAnnotation(type = Entity.class, target = Where.MODIFIABLE_TYPE)
public @interface JPAStyle {}