#!/bin/sh
#
# Convert PLZO_SHP_LV95/PLZO_OS.shp and PLZO_SHP_LV95/PLZO_OSNAME.dbf to GeoJson

PROJECT_DIR="$1"
GEOM="$PROJECT_DIR/import/src/main/resources/raw-data/PLZO_SHP_LV95/PLZO_OSNAMEPOS.shp"
NAME="$PROJECT_DIR/import/src/main/resources/raw-data/PLZO_SHP_LV95/PLZO_OSNAME.dbf"
DB_FILE="tmp.locations.sqlite"
ogr2ogr -dsco spatialite=yes "$DB_FILE" -t_srs EPSG:4326 -nlt geometry "$GEOM"
ogr2ogr -update "$DB_FILE" "$NAME"

ogr2ogr -f GeoJSON -nln NAME -s_srs EPSG:4326 -t_srs EPSG:4326 \
       -sql "select n.langtext as name, g.geometry as geometry from plzo_osnamepos g join plzo_osname n on g.osnam_uuid = n.uuid order by name" \
       /vsistdout/ $DB_FILE \
       | jq -c '.features[].properties |= with_entries( .key |= ascii_upcase )'
