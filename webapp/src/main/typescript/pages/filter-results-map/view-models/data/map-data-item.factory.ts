import { FilterDistribution, LocationDistribution, LocationsToFiltersEntry, TokensTableRow } from "../../../../client";
import { StringMapService } from "../../../../util/services/string-map.service";
import { LocationDataMap } from "../../../../models/locations/location.type";
import { GeometryData, MapDataItemDataEntry } from "./map-data-item";
import { LocationData } from "../../../../models/locations/location-data.interface";
import { typesDistributionDistance } from "../../../../models/types-distribution";

const MapDataItemErrorStates = [
    'LOCATION_LABEL_IS_EMPTY',
    'LOCATION_DATA_IS_EMPTY',
    'COORDINATES_ARE_MISSING',
    'FILTER_LABEL_MISSING',
    'FILTER_DATA_IS_MISSING'
] as const;
export type MapDataItemErrorState = typeof MapDataItemErrorStates[number];

export function isMapDataItemErrorState(val: any): val is MapDataItemErrorState {
    return MapDataItemErrorStates.indexOf(val) >= 0;
}
export function isMapDataItem(val: GeometryData | MapDataItemErrorState): val is GeometryData {
    return !isMapDataItemErrorState(val);
}

export class MapDataItemFactory {

    private readonly stringMapService = new StringMapService();

    private create<T>(
        locationName: string | undefined,
        locations: LocationDataMap,
        existing: GeometryData | undefined,
        rawData: T[] | undefined,
        mapper: (entry: T) => MapDataItemDataEntry | MapDataItemErrorState,
    ): GeometryData | MapDataItemErrorState {
        const geometry = this.initGeometry(locationName, locations);
        if (isMapDataItemErrorState(geometry)) { return geometry; }
        const entriesByLabel = this.entriesByLabel(existing);
        if (rawData) {
            try {
                rawData.forEach(raw => {
                    const mapped = mapper(raw);
                    if (isMapDataItemErrorState(mapped)) { throw mapped };
                    const label = mapped.label;
                    entriesByLabel[label] = { ...entriesByLabel[label], ...mapped };
                })
            } catch(error) {
                if (isMapDataItemErrorState(error)) {
                    return error;
                } else {
                    throw error;
                }
            }
        }
        return this.merge(geometry, entriesByLabel);
    }

    createFromTypesDistribution(
        locationDistribution: LocationDistribution,
        filterDistributions: FilterDistribution[],
        filterNames: string[],
        locations: LocationDataMap,
        existing?: GeometryData
    ): GeometryData | MapDataItemErrorState {
        return this.create(locationDistribution.name, locations, existing, filterDistributions, filterDistribution => {
            const filterLabel = filterNames[filterDistribution.id??-1];
            if (filterLabel) {
                return {
                    label: filterLabel,
                    distance: typesDistributionDistance(filterDistribution.vector, locationDistribution.vector)
                };
            } else {
                return 'FILTER_LABEL_MISSING';
            }
        });
    }

    createFromLocationEntry(
        locationEntry: LocationsToFiltersEntry,
        filterNames: string[],
        locations: LocationDataMap,
        existing?: GeometryData
    ): GeometryData | MapDataItemErrorState {
        return this.create(locationEntry.location, locations, existing, locationEntry.entries, filterDistance => {
            const filterLabel = filterNames[filterDistance.filterId??-1];
            if (filterLabel) {
                return {
                    label: filterLabel,
                    distance: filterDistance.distance
                };
            } else {
                return 'FILTER_LABEL_MISSING';
            }
        });
    }

    createFromTokensTableRow(
        tokensTableRow: TokensTableRow,
        locations: LocationDataMap,
        existing?: GeometryData
    ): GeometryData | MapDataItemErrorState {
        return this.create(tokensTableRow.label, locations, existing, tokensTableRow.entries, entry => {
            if (entry.label) {
                return {
                    label: entry.label,
                    tokensAbs: entry.tokensAbs,
                    tokensRel: entry.tokensRel
                };
            } else {
                return 'FILTER_LABEL_MISSING';
            }
        });
    }

    private locationData(key: string, locations: LocationDataMap): LocationData | MapDataItemErrorState {
        const locationData = locations.get(key);
        if (!locationData) {
            console.error('Location data', key, location);
            return 'LOCATION_DATA_IS_EMPTY';
        }
        const coordinates = locationData.coordinates[0];
        if (!coordinates || !coordinates[0] || !coordinates[0][0]) {
            console.error('Coordinates', key, location);
            return 'COORDINATES_ARE_MISSING';
        }
        return locationData;
    }

    private initGeometry(locationName: string | undefined, locations: LocationDataMap) : Omit<GeometryData, "data"> | MapDataItemErrorState {
        if (!locationName) {
            return 'LOCATION_LABEL_IS_EMPTY';
        }
        const locationData = this.locationData(locationName, locations);
        if (isMapDataItemErrorState(locationData)) {
            return locationData;
        }
        const [x, y] = locationData.coordinates[0][0];
        return {
            label: locationName,
            geometry: {
                x,
                y,
                geoJSON: locationData.geoJSON
            },
        };
    }

    private entriesByLabel(existing?: GeometryData): Record<string, MapDataItemDataEntry> {
        const result: Record<string, MapDataItemDataEntry> = {}
        existing?.data.entries.forEach(entry => result[entry.label] = { ...entry });
        return result;
    }

    private merge(geometry: Omit<GeometryData, "data">, entriesByLabel: Record<string, MapDataItemDataEntry>): GeometryData {
        let totalAbs = 0;
        let totalRel = 0;

        const entries = Object.keys(entriesByLabel).map(key => {
            const entry = entriesByLabel[key];
            totalAbs += entry.tokensAbs ?? 0;
            totalRel += entry.tokensRel ?? 0;
            return entry;
        });

        const result: GeometryData = {
            ...geometry,
            data: { totalAbs, totalRel, entries }
        }

        return result;
    }

}
