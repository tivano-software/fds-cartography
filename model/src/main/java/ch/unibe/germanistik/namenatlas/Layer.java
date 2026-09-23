/* (C) 2021 Tivano Software GmbH */
package ch.unibe.germanistik.namenatlas;

import org.immutables.value.Value;

/**
 * Marks {@link Tokens} derived from a specific data source
 *
 * <p>Each {@link Layer} corresponds to a set of {@link Tokens} derived from a specific
 * aspect of the data provided by one {@link DataProvider}. Most layers also correspond
 * to a given time period in which the associated {@link Tokens} are documented at
 * a given {@link Location}, but due to the nature of the raw data, this is not a precise match
 * in all cases.</p>
 *
 * <p>See the documentation for the individual {@link Layer.ID} values for details.</p>
 */
@Value.Immutable
public interface Layer {

    public enum ID {
        /**
         * {@link Tokens} with this layer are derived from the place of residence of swiss citizens in 2020.
         * Data in this layer has been provided by {@link DataProvider#BFS}.
         */
        BFS_CH,

        /**
         * {@link Tokens} with this layer are derived from the place of residence of non-citizen residents in 2020.
         * Data in this layer has been provided by {@link DataProvider#BFS}.
         */
        BFS_OTHER,

        /**
         * {@link Tokens} with this layer are derived from the place of citizenship ("Bürgerort") of swiss citizens in 2020.
         * Data in this layer has been provided by {@link DataProvider#BFS}.
         */
        BFS_ORIGIN,

        /**
         * {@link Tokens} with this layer are derived from the place of residence of swiss citizens between 1900 and 1960.
         * Data in this layer has been provided by {@link DataProvider#HLS_FAM}
         */
        HLS_C,

        /**
         * {@link Tokens} with this layer are derived from the place of residence of swiss citizens between 1800 and 1900.
         * Data in this layer has been provided by {@link DataProvider#HLS_FAM}
         */
        HLS_B,

        /**
         * {@link Tokens} with this layer are derived from the place of residence of swiss citizens before 1800.
         * Data in this layer has been provided by {@link DataProvider#HLS_FAM}
         */
        HLS_A,

        /**
         * {@link Tokens} with this layer are derived from the place of citizenship ("Bürgerort") of swiss citizens before 1900.
         * Data in this layer has been provided by {@link DataProvider#HLS_FAM}
         */
        HLS_ORIGIN,

        /**
         * {@link Tokens} with this layer are test data.
         */
         TEST_A,

         /**
          * {@link Tokens} with this layer are test data.
          */
          TEST_B
    }

    ID getId();
    String getName();
    String getDescription();
}
