#!/bin/sh
#
# Create a spatialite DB with data from municipality Shapefile
# and locations.csv

PROJECT_DIR="$1"
SHAPEFILE="$PROJECT_DIR/import/src/main/resources/raw-data/SHAPEFILE_LV95_LN02/swissBOUNDARIES3D_1_3_TLM_HOHEITSGEBIET.shp"
CSV="$PROJECT_DIR/import/src/main/resources/database/locations.csv"
DB_FILE="$2"
ogr2ogr -dsco spatialite=yes "$DB_FILE" -t_srs EPSG:4326 -nlt geometry -nln geom_src "$SHAPEFILE"
ogrinfo -sql "update geom_src set geometry = CastToXY(geometry)" "$DB_FILE"
sqlite3 "$DB_FILE" ".import --csv $CSV locations"

# Map Oberlangenegg and Unterlangenegg as a common region "Oberlangenegg/Unterlangenegg",
# because a majority of tokens is in Schwarzenegg, which belongs in par to Oberlangenegg and
# in part to Unterlangenegg
sqlite3 "$DB_FILE" "update geom_src set name = 'Oberlangenegg/Unterlangenegg' where name in ('Oberlangenegg', 'Unterlangenegg')"

# Add an entry for "Staatswald Galm" to locations so that the geography is
# included at the DISTRICT and CANTON levels
sqlite3 "$DB_FILE" "insert into locations (id, name, municipality, district, canton, country) values ('9999', '', 'Staatswald Galm', 'Bezirk See / District du Lac', 'FR', 'CH')"

