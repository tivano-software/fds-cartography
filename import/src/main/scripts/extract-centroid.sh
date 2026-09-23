#!/bin/sh
#
# Extract center point of a layer with polygon data.
#
# If the layer intersects lake area, the lake area is excluded from center point calculation
# to ensure that the center point is not placed inside the lake. 
#

PROJECT_DIR=$1
FILE_POLY=$2
FILE_POINT=${FILE_POLY%*.poly.json}.point.json
LAYER=$(ogrinfo $FILE_POLY | tail -n 1 | sed -e 's/[^ ]* //' -e 's/ .*//')
echo "Importing polygon data from $FILE_POLY"
ogr2ogr -dsco spatialite=yes tmp.sqlite -nlt geometry $FILE_POLY
echo "Importing lake polygon data"
ogr2ogr -update tmp.sqlite -nlt geometry -nln lakes_raw "$PROJECT_DIR/webapp/src/main/webapp/data/geojson-water-poly.json"
ogrinfo -sql "create table lakes_mask as select ST_Union(lakes_raw.geometry) geometry from lakes_raw" tmp.sqlite # Total lakes geometry as mask
ogrinfo -sql "select RecoverGeometryColumn('lakes_mask', 'geometry', 4326, 'geometry')" tmp.sqlite # assumes WGS 84 projection

echo "Writing point data to $FILE_POINT"
# Only keep community area data that does not intersect with a lake. Exception is 'Isole di Brissago', which are islands in Lago Maggiore and should be kept.
ogrinfo -sql "update $LAYER set geometry = Difference(geometry, lake.overlap) from (select $LAYER.name, Intersection($LAYER.geometry, lakes_mask.geometry) overlap from $LAYER, lakes_mask where overlap is not null) as lake where $LAYER.name = lake.name and $LAYER.name <> 'Isole di Brissago'" tmp.sqlite
ogrinfo -sql "update $LAYER set geometry = ST_Centroid(geometry)" tmp.sqlite
ogr2ogr -f GeoJSON -nln $LAYER -sql "select * from $LAYER" \
       /vsistdout/ tmp.sqlite \
       | jq '.features[].properties |= with_entries( .key |= ascii_upcase )' \
       > $FILE_POINT
       
rm tmp.sqlite
echo "Done"
