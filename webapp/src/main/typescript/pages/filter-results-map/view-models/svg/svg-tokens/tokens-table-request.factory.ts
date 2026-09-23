import { GetLocationsToFiltersDistanceMatrixLocationsLevelEnum, GetLocationsToFiltersDistanceMatrixRequest, GetLocationsToLocationsDistanceMatrixLocationsLevelEnum, GetLocationsToLocationsDistanceMatrixRequest, GetTokensDistributionLocationsLevelEnum, GetTokensDistributionRequest, GetTokensTableInnerGroupEnum, GetTokensTableLocationsLevelEnum, GetTokensTableOuterGroupEnum, GetTokensTableRequest } from "../../../../../client";
import { LocationLevel } from "../../../../../models/locations/location.type";

export function tokenTablesRequest(filters: string, locationsLevel: LocationLevel): GetTokensTableRequest {
    return {
        filters,
        innerGroup: GetTokensTableInnerGroupEnum.TYPES,
        outerGroup: GetTokensTableOuterGroupEnum.LOCATIONS,
        locationsLevel: locationsLevel as GetTokensTableLocationsLevelEnum,
        absoluteCountOnly: false
    };
}

export function typesDistributionRequest(filters: string, locationsLevel: LocationLevel): GetTokensDistributionRequest {
    return {
        filters: filters,
        locationsLevel: locationsLevel as GetTokensDistributionLocationsLevelEnum
    };
}

export function locationsToFilterDistancesRequest(filters: string, locationsLevel: LocationLevel): GetLocationsToFiltersDistanceMatrixRequest {
    return {
        filters: filters,
        locationsLevel: locationsLevel as GetLocationsToFiltersDistanceMatrixLocationsLevelEnum
    };
}

export function locationsToLocationsDistancesRequest(filters: string, locationsLevel: LocationLevel): GetLocationsToLocationsDistanceMatrixRequest {
    return {
        filters: filters,
        locationsLevel: locationsLevel as GetLocationsToLocationsDistanceMatrixLocationsLevelEnum
    };
}
