# Raw data used in this module

## Raw data for [`Locaction`](../apidocs/ch/unibe/germanistik/namenatlas/Location.html)

* `src/main/resources/raw-data/be-t-00.04-agv-01.csv`: Sheet *GDE* of the
  ["Amtliches Gemeindeverzeichnis der Schweiz"](https://www.bfs.admin.ch/bfsstatic/dam/assets/20844503/master)
  in CSV format. Main datasource for the [`Locaction`](../apidocs/ch/unibe/germanistik/namenatlas/Location.html)
  entries.
* `src/main/resources/raw-data/extra-locations.csv`: Manually maintained
  [`Location`](../apidocs/ch/unibe/germanistik/namenatlas/Location.html) data representing
  neighbouring countries.
* `src/main/resources/raw-data/eCH-0135_Code_Heimatorte.csv`:
  Directory of "place of origin" names, plus (some) information that maps place of origin data
  to contemporary municipalities. Note that this mapping is not one-to-one, and the mapping as
  given in in `eCH-0135_Code_Heimatorte.csv` is incomplete.
* `src/main/resources/raw-data/20220101_GDEHist_GDE.txt`: File `01.02/20220101_GDEHist_GDE.txt` from the
  ["Historisiertes Gemeindeverzeichnis der Schweiz (TXT Format)"](https://www.bfs.admin.ch/bfs/de/home/grundlagen/agvch/historisiertes-gemeindeverzeichnis.assetdetail.20844507.html) archive. This is used to map entries in `eCH-0135_Code_Heimatorte.csv`
  to locations using the *historyMunicipalityId* column in `eCH-0135_Code_Heimatorte.csv`. The file has been recoded
  from the original ISO-8859-1 encoding to UTF-8 on import.

The data used for locations is &copy; [Bundesamt für Statistik](https://www.bfs.admin.ch) and licensed as [OPEN BY](https://www.bfs.admin.ch/bfs/en/home/fso/swiss-federal-statistical-office/terms-of-use.html).

## Raw data for the mapping frontend

* Directory `src/main/resources/raw-data/SHAPEFILE_LV95_LN02/`: ESRI Shapefiles with topography data at the municipality,
  district and canton level from
  [swissboundaries3d_2021-01_2056_5728.shp.zip](https://data.geo.admin.ch/ch.swisstopo.swissboundaries3d/swissboundaries3d_2021-01/swissboundaries3d_2021-01_2056_5728.shp.zip),
  provided by [swisstopo](https://www.swisstopo.admin.ch/de/geodata/landscape/boundaries3d.html).

The geodata used for the mapping frontend is &copy; [Federal Office of Topography swisstopo](https://www.swisstopo.admin.ch/en/) and licensed under the [Terms of use for free geodata and geoservices (OGD) from swisstopo](https://www.swisstopo.admin.ch/en/terms-of-use-free-geodata-and-geoservices).

## Raw data for [`Type`](../apidocs/ch/unibe/germanistik/namenatlas/Type.html) and [`Tokens`](../apidocs/ch/unibe/germanistik/namenatlas/Tokens.html)

* Directory `src/main/resources/raw-data/etdb/`: Database dump of https://www.familiennamen.nicoledidi.ch/werkstatt/index.php. 
  
  _Note: Due to licensing contraints, this file is not included in the published sources._

* `historische_familiennamen.csv`: Historical data from the [Register of Swiss Surnames](https://hls-dhs-dss.ch/famn/?lg=e).
  The title for the first column in the file has been changed manually from "NAME" to "NAME_LOWER" to avoid duplicate column titles. 

  _Note: Due to licensing contraints, this file is not included in the published sources. For data access, please contact_
  
  **Historisches Lexikon der Schweiz**<br>
  Gerberngasse 39<br>
  Postfach 322<br>
  CH-3000 Bern 13<br>
  +41 31 313 13 30<br>
  info@hls.ch
* `../../NACHNAMEN_TOTAL_2020.csv`: Population data for 2020 provided by the
  [Swiss Federal Statistics Office](https://www.bfs.admin.ch/bfs/). 
  
  _Note: Due to licensing contraints and for reasons of privacy protection, 
  this file is not included in the published sources. For data access, please contact_

  **Bundesamt für Statistik**  
  _Sektion Demografie und Migration_<br>
  Espace de l'Europe 10<br>
  CH-2010 Neuchâtel<br>
  +41 58 463 67 11<br>
  info.dem@bfs.admin.ch<br>
