/* © 2022 Tivano Software GmbH */
package ch.unibe.germanistik.namenatlas.config;

import org.immutables.value.Value;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;

/** Models arbitrary configuration data. */
@Value.Immutable
@JsonDeserialize(as = ImmutableConfiguration.class)
public interface Configuration {
    public String getType();
    public String getName();
    public Object getData();
}
