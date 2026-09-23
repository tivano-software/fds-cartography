import { LocationData } from "./location-data.interface";
import { LocationLevel, LocationDataMap, LocationPathType, LocationString } from "./location.type";

export interface LocationsMap {
    readonly get: (level: LocationLevel, location: LocationString, type: LocationPathType) => Promise<LocationData | undefined>;
    readonly getMap: (level: LocationLevel, type: LocationPathType) => Promise<LocationDataMap>;
}