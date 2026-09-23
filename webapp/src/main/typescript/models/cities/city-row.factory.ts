import { Point2 } from "../../util/types/geometry/point2.type";
import { LocationData } from "../locations/location-data.interface";
import { LocationDataMap, LocationLevelEnum } from "../locations/location.type";
import { LOCATIONS_MAP } from "../locations/locations-map.const";
import { CityRowCSVEntry } from "./city-row-csv-entry.interface";
import { CityRow } from "./city-row.interface";

export class CityRowFactory {

    public readonly create = (entry: CityRowCSVEntry, map: LocationDataMap): CityRow => ({ ...entry, geoJSONPos: this.loadPosition(entry, map) });

    private readonly loadPosition = (entry: CityRowCSVEntry, map: LocationDataMap): Point2 | undefined => this.extractPosition(map.get(entry.name));

    private readonly extractPosition = (data: LocationData | undefined): Point2 | undefined => data && data.coordinates[0] && data.coordinates[0][0] || undefined;

}