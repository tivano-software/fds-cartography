import { GetLocationsToFiltersDistanceMatrixLocationsLevelEnum, GetLocationsToLocationsDistanceMatrixLocationsLevelEnum, GetTokensDistributionLocationsLevelEnum, GetTokensTableLocationsLevelEnum, MatchLocationFieldEnum } from "../../client";
import { Feature, LocationProperties } from "../../util/services/geojson/geojson-load.service";
import { LocationData } from "./location-data.interface";

export type LocationLevel = GetTokensTableLocationsLevelEnum | GetTokensDistributionLocationsLevelEnum | GetLocationsToFiltersDistanceMatrixLocationsLevelEnum | GetLocationsToLocationsDistanceMatrixLocationsLevelEnum | MatchLocationFieldEnum;
export const LocationLevelEnum = GetTokensTableLocationsLevelEnum;
export const TokensDistributionEnum = GetTokensDistributionLocationsLevelEnum;
export const LocationsToFiltersDistanceEnum = GetLocationsToFiltersDistanceMatrixLocationsLevelEnum;
export const LocationsToLocationsDistanceEnum = GetLocationsToLocationsDistanceMatrixLocationsLevelEnum;
export type LocationString = string;
export type LocationPathType = 'poly' | 'point';
export type LocationPathString = `${'boundaries' | 'plz'}/${string}.${LocationPathType}.json`;
export type LocationFileID = `${GetTokensTableLocationsLevelEnum}-${LocationPathType}`;
export type LocationDataMap = Map<LocationString, LocationData>;
export type LocationLevelMap = Map<LocationFileID, LocationDataMap>;