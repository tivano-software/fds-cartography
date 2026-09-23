import { Feature, LocationProperties } from "../../../../util/services/geojson/geojson-load.service";

export interface MapDataItemDataEntry {
    readonly label: string;
    readonly distance?: number;
    readonly tokensAbs?: number;
    readonly tokensRel?: number;
}

export interface GeometryData {
    readonly label: string,
    readonly geometry: {
        readonly x: number;
        readonly y: number;
        readonly geoJSON: Feature<LocationProperties>;
    }
    data: {
        readonly totalAbs?: number;
        readonly totalRel?: number;
        readonly entries: MapDataItemDataEntry[];
    };
}
