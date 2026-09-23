-- (C) 2022 Tivano Software GmbH
--
-- Imports data from the "Etymologische Datenbank" into the "Familiennamenatlas Schweiz" database.
--
-- ANY EXISTING DATA INT TYPES.LANGUAGECATEGORIES, TYPES.NAMINGMOTIVES AND TYPES.DESCRIPTION
-- WILL BE OVERWRITTEN!
--
-- Note: This file needs to be run with "psql" because of the use of \COPY

-- clean out old data
UPDATE types SET
    "dataproviders" = array_remove("dataproviders", 'ETDB'),
    "languagecategories" = '{}',
    "namingmotives" = '{}',
    "description" = null;

CREATE TEMPORARY TABLE etdb_import (
    "name" character varying(100) NOT NULL PRIMARY KEY,
    "languagecategories" language_category[7] NOT NULL,
    "namingmotives" naming_motive[9] NOT NULL,
    "description" text
);
\COPY etdb_import ("name", "languagecategories", "namingmotives", "description") FROM './etdb-import.csv' WITH CSV HEADER

-- Note: The update does NOT check for entries in etdb_import that are not present in types
-- It is assumed that this is checked when importing the raw data.
UPDATE types t SET
    dataproviders = array_append(t.dataproviders, 'ETDB'),
    languagecategories = i.languagecategories,
    namingmotives = i.namingmotives,
    description = i.description
  FROM etdb_import i
 WHERE t.name = i.name