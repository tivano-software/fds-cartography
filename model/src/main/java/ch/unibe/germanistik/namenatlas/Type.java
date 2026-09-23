/* (C) 2021 Tivano Software GmbH */
package ch.unibe.germanistik.namenatlas;

import java.util.Set;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;

import org.checkerframework.checker.nullness.qual.Nullable;
import org.immutables.value.Value;

/**
 * A distinct family name
 */
@Value.Immutable
@JsonDeserialize(as = ImmutableType.class)
public interface Type {

    /** Unique interal id. */
    int getId();

    /** The family name described by this {@link Type}. */
    String getName();

    /** Data provider(s) for information used in this {@link Type}. */
    Set<DataProvider> getDataProviders();

    Set<LanguageCategory> getLanguageCategories();
    Set<NamingMotive> getNamingMotives();

    /** Etymological description of this {@link Type}. */
    @Nullable String getDescription();
}
