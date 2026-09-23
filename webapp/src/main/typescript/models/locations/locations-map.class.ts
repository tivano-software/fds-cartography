import { MatchLocationFieldEnum } from "../../client";
import { call } from "../../util/helper/mapper/call.function";
import { Feature, GeoJSONLoadService, LocationProperties } from "../../util/services/geojson/geojson-load.service";
import { LocationDataFactory } from "./location-data.factory";
import { LocationData } from "./location-data.interface";
import { LocationLevelMap, LocationString, LocationDataMap, LocationPathString, LocationPathType, LocationFileID, LocationLevel, LocationLevelEnum, TokensDistributionEnum, LocationsToFiltersDistanceEnum, LocationsToLocationsDistanceEnum } from "./location.type";
import { LocationsMap } from "./locations-map.interface";

export class LocationsMapDefault implements LocationsMap {

    private readonly geoJSONLoadService = new GeoJSONLoadService();
    private readonly locationDataFactory = new LocationDataFactory();
    private readonly locationMap: LocationLevelMap;


    public constructor() {
        this.locationMap = new Map<LocationFileID, Map<LocationString, LocationData>>();
    }


    public readonly get = async (level: LocationLevel, location: LocationString, type: LocationPathType): Promise<LocationData | undefined> => {
        const map = await this.getMap(level, type);
        const data = map.get(location);
        if (!data) {
            console.error(`Can't found location data for ${level}, ${location}, ${type}.`);
        }
        return data;
    }


    public readonly getMap = async (level: LocationLevel, type: LocationPathType): Promise<LocationDataMap> => {
        const localMap = this.locationMap.get(this.createLocationFileID(level, type));
        if (localMap) {
            return localMap;
        }
        const map = await this.generateLocationMap(level, type);
        this.locationMap.set(this.createLocationFileID(level, type), map);
        return map;
    };


    private readonly createLocationFileID = (level: LocationLevel, type: LocationPathType): LocationFileID => `${level}-${type}`;


    private readonly generateLocationMap = async (level: LocationLevel, type: LocationPathType): Promise<LocationDataMap> => {
        try {
            const result = await this.geoJSONLoadService.load<LocationProperties>(this.mapLocationToPath(level, type));
            return new Map(result.features.map<[string, LocationData]>(feature => [feature.properties.NAME, this.locationDataFactory.create(feature)]));
        } catch (exception) {
            throw new Error(`Can't generate location map (Level: ${level}; Type: ${type}). Caused by ${exception}`)
        }
    };


    private readonly mapLocationToPath = (locationsLevel: LocationLevel, type: LocationPathType): LocationPathString => {
        return ((): LocationPathString => {
            switch (locationsLevel) {
                case LocationsToFiltersDistanceEnum.NAME:
                case LocationsToLocationsDistanceEnum.NAME:
                case TokensDistributionEnum.NAME:
                case LocationLevelEnum.NAME:
                case MatchLocationFieldEnum.NAME:
                    return `boundaries/geojson-NAME.${type}.json`;
                case LocationsToFiltersDistanceEnum.CANTON:
                case LocationsToLocationsDistanceEnum.CANTON:
                case TokensDistributionEnum.CANTON:
                case LocationLevelEnum.CANTON:
                case MatchLocationFieldEnum.CANTON:
                    return `boundaries/geojson-KANTONSGEBIET.${type}.json`;
                case LocationsToFiltersDistanceEnum.DISTRICT:
                case LocationsToLocationsDistanceEnum.DISTRICT:
                case TokensDistributionEnum.DISTRICT:
                case LocationLevelEnum.DISTRICT:
                case MatchLocationFieldEnum.DISTRICT:
                    return `boundaries/geojson-BEZIRKSGEBIET.${type}.json`;
                case LocationsToFiltersDistanceEnum.MUNICIPALITY:
                case LocationsToLocationsDistanceEnum.MUNICIPALITY:
                case TokensDistributionEnum.MUNICIPALITY:
                case LocationLevelEnum.MUNICIPALITY:
                case MatchLocationFieldEnum.MUNICIPALITY:
                    return `boundaries/geojson-HOHEITSGEBIET.${type}.json`;
                case LocationsToFiltersDistanceEnum.COUNTRY:
                case LocationsToLocationsDistanceEnum.COUNTRY:
                case TokensDistributionEnum.COUNTRY:
                case LocationLevelEnum.COUNTRY:
                case MatchLocationFieldEnum.COUNTRY:

                    return `boundaries/geojson-LANDESGEBIET.${type}.json`;
            }
        })();
    };


}