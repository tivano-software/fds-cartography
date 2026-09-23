/* (C) 2022 Tivano Software GmbH */
package ch.unibe.germanistik.namenatlas.persistence;

import java.util.Set;

import org.checkerframework.checker.nullness.qual.Nullable;
import org.hibernate.annotations.Immutable;
import org.immutables.value.Value;

import ch.unibe.germanistik.namenatlas.DataProvider;
import ch.unibe.germanistik.namenatlas.LanguageCategory;
import ch.unibe.germanistik.namenatlas.NamingMotive;
import ch.unibe.germanistik.namenatlas.Type;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Converter;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * JPA entity for {@link Type}
 */
@Value.Modifiable @JPAStyle
@Immutable @Table(name = "types")
abstract interface TypeEntityBase extends Type {
    @Id
    @Override public abstract int getId();

    @Column(unique = true, nullable = false, insertable = false, updatable = false)
    @Override public abstract String getName();

    @Column(nullable = false)
    @Convert(converter = DataProviderSetConverter.class)
    @Override public abstract Set<DataProvider> getDataProviders();

    @Column(nullable = false)
    @Convert(converter = LanguageCategorySetConverter.class)
    @Override public abstract Set<LanguageCategory> getLanguageCategories();

    @Column(nullable = false)
    @Convert(converter = NamingMotiveSetConverter.class)
    @Override public abstract Set<NamingMotive> getNamingMotives();

    @Column(nullable = true)
    @Override public abstract @Nullable String getDescription();

    // Implementation details below
    /** {@link AttributeConverter} for {@link DataProvider} sets. */
    @Converter public static class DataProviderSetConverter extends EnumSetArrayConverter<DataProvider> {
        public DataProviderSetConverter() { super(DataProvider.class); }
    }
    /** {@link AttributeConverter} for {@link LanguageCategory} sets. */
    @Converter public static class LanguageCategorySetConverter extends EnumSetArrayConverter<LanguageCategory> {
        public LanguageCategorySetConverter() { super(LanguageCategory.class); }
    }
    /** {@link AttributeConverter} for {@link NamingMotive} sets. */
    @Converter public static class NamingMotiveSetConverter extends EnumSetArrayConverter<NamingMotive> {
        public NamingMotiveSetConverter() { super(NamingMotive.class); }
    }

}
