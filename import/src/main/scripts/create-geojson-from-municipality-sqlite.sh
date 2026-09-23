#!/bin/sh
#
# Convert 3d geometries to 2d
#

DB_FILE="$1"
LAYER="$2"
# Export from the SQLite DB back to geojson. 
if [ "$LAYER" = "MUNICIPALITY" ]; then
    # Exclude "Staatswald Galm" (which is not a municipality) for LAYER=MUNICIPALITY
   SQL="select l.$LAYER as name, ST_Union(g.geometry) as geometry from geom_src g join locations l on g.name = l.municipality where g.name <> 'Staatswald Galm' group by l.$LAYER"
else
   SQL="select l.$LAYER as name, ST_Union(g.geometry) as geometry from geom_src g join locations l on g.name = l.municipality group by l.$LAYER"
fi
ogr2ogr -f GeoJSON -nln $LAYER \
       -sql "$SQL" \
       /vsistdout/ $DB_FILE \
       | jq -c '.features[].properties |= with_entries( .key |= ascii_upcase )'
