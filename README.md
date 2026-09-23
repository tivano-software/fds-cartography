# Cartography and statistics software for the SNF project _Family name atlas of German-speaking Switzerland_

This repository contains the source code of the cartography and statistics software used to produce the maps for [Family name atlas of German-speaking Switzerland](https://familiennamenatlas.unibe.ch/en/index.html).

## Installation

* Install the necessary prerequisites:
  * [Apache Maven](https://maven.apache.org/) version 3.6 or later
  * [JDK 17](https://openjdk.org/projects/jdk/17/)
    * Note: At the moment, the project does not compile with a JDK > 17.
  * [Apache Tomcat 9.x](https://tomcat.apache.org/) or a comparable Java Servlet implementation
  * [PostgreSQL](https://www.postgresql.org/) version 12 or later.
  * An [OpenID Connect](https://openid.net/developers/discover-openid-and-openid-connect/) identity provider.
* Clone this repository
* Build the application with `mvn package`
* Create the database schema and import the data with the scripts packaged in the `namenatlas-import-${version}-database.zip` artifact.
* Configure the webapp context to match your database and OIDC installation. A template webapp context is provided in `webapp/src/main/webapp/META-INF/context.xml` and packaged in the `webapp/target/ROOT.war` artifact.
* Deploy the `webapp/target/ROOT.war` artifact to your Tomcat installation.

## Data Distribution

For legal reasons, the data types and tokens data used to produce the published maps cannot be included in this repository. Instead, we include a minimal set of test data in the layers `TEST_A` and `TEST_B` to demonstrate the software. 

For access to the real data, please contact
* for historical data in layers `HLS_A`, `HLS_B`, `HLS_C` and `HLS_ORIGIN`:<br>
  **Historisches Lexikon der Schweiz**<br>
  Gerberngasse 39<br>
  Postfach 322<br>
  CH-3000 Bern 13<br>
  +41 31 313 13 30<br>
  info@hls.ch<br>
* for recent data in layers `BFS_CH`, `BFS_OTHER` and `BFS_ORIGIN`:<br>
  **Bundesamt für Statistik**<br>
  _Sektion Demografie und Migration_<br>
  Espace de l'Europe 10<br>
  CH-2010 Neuchâtel<br>
  +41 58 463 67 11<br>
  info.dem@bfs.admin.ch<br>
