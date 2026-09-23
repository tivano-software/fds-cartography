# Data import module

This module provides the tools to prepare the raw data provided for the project
for import, and to import the prepared data to a PostgreSQL data base.

In addition, this module is used to archive both the prepared data and the
[raw data](raw-data.md), with the exception of the raw population data provided by
the <a href="../apidocs/ch/unibe/germanistik/namenatlas/DataProvider.html#BFS">Swiss
Federal Statistics Office</a>, which may not be archived with the project for
reasons of privacy protection.

In the standard workflow with `mvn install`, two artifacts are produced from
the prepared data:

* `namenatlas-import-${project.version}.zip`: A ZIP archive containing SQL scripts and CSV
  tables that can be used to initialize a PostgreSQL database instance.

In addition, the module produces the usual `namenatlas-import-${project.version}.jar`
artifact containing the Java code for the data preparation tools, but this
artifact is never used outside the data import module itself.

## Data preparation

Data preparation is triggered by activating specific Maven profiles.
Each of those profiles triggers one aspect of the data preparation process,
and creates or updates one or more files in subdirectories of
`src/main/resources/`.

The location for the raw data is usually a fixed path below
`src/main/resources/raw-data`. The exeption is the CSV file for
the raw population data provided by the Swiss Federal Statistics Office, which
may not be added to the project VCS. The location for this file is specified
via the system property `bfs-data.filename` which defaults
to the relative location `../../NACHNAMEN_TOTAL_2020.csv`.

Data preparation consists of
1. validating the raw data for consistency and
2. generating the prepared data file(s) in `src/main/resources/`

The validation step is implemented as [https://junit.org/](JUnit) tests for the
data preparation tools, and triggered in the `test` phase of the build process.

The actual data generation happens in the `prepare-package` phase.

The individual data preparation profiles are activated automatically when
the corresponding prepared file does not exist, and may also be activated manually
to regenerate a prepared file by passing a `-P${profile}` option to the `mvn`
command (where `${profile}` is the profile name).

### Profile `locations`

The `locations` profile triggers the generation of `src/main/resources/database/locations.csv`
from the archived raw data files `be-t-00.04-agv-01.csv`,
`eCH-0135_Code_Heimatorte.csv` and `PLZO_CSV_LV95/PLZO_CSV_LV95.csv`

### Profile `locactions-bfs-origin`

The `locactions-bfs-origin` profile triggers the generation of
`src/main/resources/intermediate/locations-for-origin.bfs.csv`
from the external raw data file `../../NACHNAMEN_TOTAL_2020.csv` (location for
this file can be configured with the system property `bfs-data.filename`).
The purpose of this file is to document the mapping from the `originName1` and
`placeOfOriginId1` columns in `../../NACHNAMEN_TOTAL_2020.csv` to an entry
in `src/main/resources/database/locations.csv`. The generated file contains
one line for every combination of `originName1` and `placeOfOriginId1`
that occurs in the original data, and shows an indicator of how that combination
if matched to a location, the assigned location name from
`src/main/resources/database/locations.csv`, and (if applicable) the
`NS1:PLACEOFORIGINNAME` and `NS1:PLACEOFORIGINID` columns from
`src/main/resources/intermediate/locations-for-place-of-origin.csv` used
for the assignment (note that these columns may differ from
`originName1` and `placeOfOriginId1`, depending on the match indicator).

### Profile `locactions-bfs-municipality`

The `locactions-bfs-municipality` profile triggers the generation of
`src/main/resources/intermediate/locations-for-municipality.bfs.csv`
from the external raw data file `../../NACHNAMEN_TOTAL_2020.csv` (location for
this file can be configured with the system property `bfs-data.filename`).
The purpose of this file is to document the mapping from the `reportingMunicipalityId`
column in `../../NACHNAMEN_TOTAL_2020.csv` to an entry
in `src/main/resources/database/locations.csv`. The generated file contains
one line for every value of  `reportingMunicipalityId` that occurs in the original data,
and shows an indicator of how that combination is matched to a location and the assigned
location name from `src/main/resources/database/locations.csv`.

### Profile `types-tokens-hls`

The `types-tokens-hls` profile triggers the generation of
`src/main/resources/intermediate/types-tokens.hls.csv`
from the archived raw data file `historische_familiennamen.csv` and
the same location data as in the `locations` profile.
The generated intermediate file has almost the same format as the final
`tokens.csv`, the only difference is that the
<a href="../apidocs/ch/unibe/germanistik/namenatlas/Type.html"><code>Type</code></a> is
referenced by the actual family name in string form instead of the internal numerical ID.

Note: The published source code contains an empty `types-tokens.hls.csv` due to licensing constraints on the original data. To regenerate it from [raw data](./raw-data.md), remove `src/main/resources/intermediate/types-tokens.hls.csv` and rebuild.

### Profile `types-tokens-bfs`

The `types-tokens-bfs` profile triggers the generation of
`src/main/resources/intermediate/types-tokens.bfs.csv`
from the external raw data file `../../NACHNAMEN_TOTAL_2020.csv` (location for
this file can be configured with the system property `bfs-data.filename`).
The generated intermediate file has the same format as the one generated by
profile `types-tokens-hls`

Note: The published source code only contains an empty `types-tokens.bfs.csv` due to licensing contraints on the original data. Note: The published source code contains an empty `types-tokens.hls.csv` due to licensing constraints on the original data. To regenerate it from [raw data](./raw-data.md), remove `src/main/resources/intermediate/types-tokens.bfs.csv` and rebuild.

### Profile `types`

The `types` profile triggers the generation of `src/main/resources/database/types.csv`
from the intermediate files `types-tokens.bfs.csv`, `types-tokens.hls.csv` and `types-tokens.example.csv`. This profile will error out if either of the intermediate files does not exist.

Note: To rebuild without the example layers, replace `types-tokens.example.csv` with a CSV file containing only the column headers.

### Profile `tokens`

The `tokens` profile triggers the generation of `src/main/resources/database/tokens.csv`
from the intermediate files `types-tokens.bfs.csv`, `types-tokens.hls.csv`, `types-tokens.example.csv` and
the already generated `database/types.csv`. This profile will error out if
either of its source files does not exist.

### Profile `etdb-import`

The `etdb-import` profile triggers the generation of `src/main/resources/database/etdb-import.csv`
from the files in the raw data directory `etdb/`.
The data from `etdb-import.csv` can be imported into an existing database with the script `src/main/resources/database/etdb-import.sql`. Running this script will overwrite all data in `types.description`, `types.namingmotives` and `types.languagecategories`, but will _not_ touch any other data.

The script `create-database.sql` also runs `etdb-import.sql`.
