-- (C) 2022 Tivano Software GmbH
--
-- Creates the "Familiennamenatlas Schweiz" database structure.
--
-- ANY EXISTING TYPES AND TABLES WITH IDENTICAL NAMES WILL BE
-- DROPPED BY THIS SCRIPT!
--
-- Note: This file needs to be run with "psql" because of the use of \COPY

-- clean out old data structures
DROP FUNCTION IF EXISTS has_element(list language_category[], elem character varying);
DROP FUNCTION IF EXISTS has_element(list naming_motive[], elem character varying);
DROP FUNCTION IF EXISTS has_element(list data_provider[], elem character varying);
DROP TABLE IF EXISTS filters;
DROP TABLE IF EXISTS tokens;
DROP TABLE IF EXISTS layers;
DROP TABLE IF EXISTS types;
DROP TABLE IF EXISTS config_data;
DROP CAST IF EXISTS (CHARACTER VARYING AS data_provider);
DROP TYPE IF EXISTS data_provider;
DROP CAST IF EXISTS (CHARACTER VARYING AS language_category);
DROP TYPE IF EXISTS language_category;
DROP CAST IF EXISTS (CHARACTER VARYING AS naming_motive);
DROP TYPE IF EXISTS naming_motive;
DROP TABLE IF EXISTS locations;
DROP TABLE IF EXISTS users;
DROP CAST IF EXISTS (CHARACTER VARYING AS user_roles);
DROP TYPE IF EXISTS user_roles;
DROP FUNCTION IF EXISTS matches_pattern(input TEXT, pattern TEXT);

-- The actual data for the database. Keep in sync with the JPA types
-- "TypeEntity", "LocationEntity", "LayerEntity" and "TokensEntity"
-- and the java types (especially enums) referenced by these entities.

CREATE TABLE layers (
    -- on the Java side, "id" is actually the enum Layer.ID, but using a PostgreSQL enum
    -- here does not work well with JPA, as JPA (or at least Hibernate) insists on
    -- using the enum ordinal as the database value for the enum. For this reason,
    -- layer ID is defined as an int in the database and not as an enum type.
    -- Important: Keep "id" values synchronized with the Layer.ID enum ordinals!
    "id" smallint NOT NULL UNIQUE,
    "name" character varying(15) NOT NULL UNIQUE,
    "description" character varying(500)
);
\COPY layers ("id", "name", "description") FROM './layers.csv' WITH CSV HEADER

CREATE TABLE locations (
    "id" integer NOT NULL PRIMARY KEY,
    "name" character varying(50) UNIQUE,
    "municipality" character varying(50),
    "district" character varying(50),
    "canton" character varying(2),
    "country" character varying(2)
);
\COPY locations ("id", "name", "municipality", "district", "canton", "country") FROM './locations.csv' WITH CSV HEADER
-- fix empty columns from CSV (these get imported as NULL) and change all columns to be NOT NULL
UPDATE locations SET "name" = '' WHERE "name" IS NULL;
UPDATE locations SET "municipality" = '' WHERE "municipality" IS NULL;
UPDATE locations SET "district" = '' WHERE "district" IS NULL;
UPDATE locations SET "canton" = '' WHERE "canton" IS NULL;
UPDATE locations SET "country" = '' WHERE "country" IS NULL;
ALTER TABLE locations
    ALTER "name" SET NOT NULL,
    ALTER "municipality" SET NOT NULL,
    ALTER "district" SET NOT NULL,
    ALTER "canton" SET NOT NULL,
    ALTER "country" SET NOT NULL;

CREATE INDEX ON locations ("municipality");
CREATE INDEX ON locations ("district");
CREATE INDEX ON locations ("canton");
CREATE INDEX ON locations ("country");

CREATE TYPE data_provider AS ENUM ('BFS', 'HLS_FAM', 'ETDB', 'EXAMPLE');
CREATE CAST (CHARACTER VARYING AS data_provider) WITH INOUT AS IMPLICIT;
CREATE TYPE language_category AS ENUM (
    'GEM_DEU',
    'ROH',
    'ITA',
    'FRA',
    'GRC_LAT',
    'UNKNOWN',
    'OTHER'
);
CREATE CAST (CHARACTER VARYING AS language_category) WITH INOUT AS IMPLICIT;
CREATE TYPE naming_motive AS ENUM (
    'ORIGIN_NAME',
    'RESIDENCE_NAME',
    'OCCUPATION_NAME',
    'OCCUPATION_SOBRIQUET',
    'SOBRIQUET',
    'PATRONYM',
    'METRONYM',
    'OTHER_OR_MIXED',
    'PROBLEMATIC_NAME'
);
CREATE CAST (CHARACTER VARYING AS naming_motive) WITH INOUT AS IMPLICIT;
CREATE TABLE types (
    "id" integer NOT NULL PRIMARY KEY,
    "name" character varying(100) NOT NULL UNIQUE,
    "dataproviders" data_provider[3] NOT NULL,
    "languagecategories" language_category[7] NOT NULL,
    "namingmotives" naming_motive[9] NOT NULL,
    "description" text
);
\COPY types ("id", "name", "languagecategories", "namingmotives", "dataproviders", "description") FROM './types.csv' WITH CSV HEADER
-- TODO: create appropriate indexes on the array columns to speed up queries using these columns as criteria

-- Helper function to check for a regexp match.
-- Needed because JPA/QueryDSL cannot use the "~" operator, but can call a function.
CREATE FUNCTION matches_pattern (input TEXT, pattern TEXT) RETURNS BOOLEAN IMMUTABLE PARALLEL SAFE AS $$
    SELECT input ~ pattern;
$$ LANGUAGE SQL;
-- Type specific helper functions to check if a value is in an enum array.
-- Needed because of casting issues with enums from JPA/QueryDSL.
CREATE FUNCTION has_element(list language_category[], elem character varying) RETURNS BOOLEAN IMMUTABLE PARALLEL SAFE AS $$
    SELECT list @> array[elem::language_category];
$$ LANGUAGE SQL;
CREATE FUNCTION has_element(list data_provider[], elem character varying) RETURNS BOOLEAN IMMUTABLE PARALLEL SAFE AS $$
    SELECT list @> array[elem::data_provider];
$$ LANGUAGE SQL;
CREATE FUNCTION has_element(list naming_motive[], elem character varying) RETURNS BOOLEAN IMMUTABLE PARALLEL SAFE AS $$
    SELECT list @> array[elem::naming_motive];
$$ LANGUAGE SQL;


CREATE TABLE tokens (
    "type" integer NOT NULL REFERENCES types ("id"),
    "location" integer NOT NULL REFERENCES locations ("id"),
    "layer" smallint NOT NULL REFERENCES layers ("id"),
    "tokens" integer NOT NULL
);
\COPY tokens ("type", "location", "layer", "tokens") FROM './tokens.csv' WITH CSV HEADER

-- User management. Keep in sync with JPA type "UserEntity" and related
-- types.
CREATE TYPE user_roles AS ENUM ('USER', 'ADMIN');
CREATE CAST (CHARACTER VARYING AS user_roles) WITH INOUT AS IMPLICIT;
CREATE TABLE users (
    "id" integer GENERATED ALWAYS AS IDENTITY NOT NULL PRIMARY KEY,
    "email" character varying(254) NOT NULL UNIQUE,
    "roles" user_roles[2] NOT NULL
);
\COPY users ("email", "roles") FROM './users.csv' WITH CSV HEADER

-- Filter management. Keep in sync with JPA type "NamedFilterEntity" and related
-- types.
CREATE TABLE filters (
    "id" integer GENERATED ALWAYS AS IDENTITY NOT NULL PRIMARY KEY,
    "name" character varying(255) NOT NULL UNIQUE,
    "editable" boolean NOT NULL,
    "filter" jsonb NOT NULL,
    "description" text,
    "initial_author" integer NOT NULL REFERENCES users ("id"),
    "last_editor" integer NOT NULL REFERENCES users ("id"),
    "created_at" timestamp NOT NULL,
    "last_edited_at" timestamp NOT NULL
);

-- Configuration data management. Keep in sync with JPA type "ConfigurationEntity" and related
-- types.
CREATE TABLE config_data (
    "id" integer GENERATED ALWAYS AS IDENTITY NOT NULL PRIMARY KEY,
    "type" character varying(255) NOT NULL,
    "name" character varying(255) NOT NULL,
    "data" jsonb NOT NULL,
    "initial_author" integer NOT NULL REFERENCES users ("id"),
    "last_editor" integer NOT NULL REFERENCES users ("id"),
    "created_at" timestamp NOT NULL,
    "last_edited_at" timestamp NOT NULL,
    constraint unique_type_and_name UNIQUE("type", "name")
);
