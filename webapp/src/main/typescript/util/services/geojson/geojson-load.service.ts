import { Point2 } from "../../types/geometry/point2.type";
import { FileNameStringJSON, InnerPathString } from "../../types/template-types/file-name-string.type";
import { LoadService } from "../load/load.service";

export class GeoJSONLoadService {

    private static readonly BASE_PATH: InnerPathString = 'data/';
    private readonly loadService = new LoadService();

    async load<Properties>(fileName: FileNameStringJSON): Promise<FeatureCollection<Properties>> {
        const stream = await this.loadService.loadByBase(GeoJSONLoadService.BASE_PATH, fileName);
        const result = await stream.json();
        return result as FeatureCollection<Properties>;
    }

}

export interface FeatureCollection<Properties> {
    name: string;
    type: 'FeatureCollection';
    crs: {
        properties: {
            name: string;
        };
        type: 'name';
    }
    features: Feature<Properties>[];
}

export type Feature<Properties> = Point<Properties>
    | Polygon<Properties>
    | LineString<Properties>
    | MultiLineString<Properties>
    | MultiPolygon<Properties>;

export interface Point<Properties> {
    type: 'Feature';
    geometry: {
        type: 'Point';
        coordinates: Point2;
    }
    properties: Properties;
}

export interface Polygon<Properties> {
    type: 'Feature';
    geometry: {
        type: 'Polygon';
        coordinates: Point2[][];
    }
    properties: Properties;
}

export interface MultiPolygon<Properties> {
    type: 'Feature';
    geometry: {
        type: 'MultiPolygon';
        coordinates: Point2[][][];
    }
    properties: Properties;
}

export interface LineString<Properties> {
    type: 'Feature';
    geometry: {
        type: 'LineString';
        coordinates: Point2[];
    },
    properties: Properties;
}

export interface MultiLineString<Properties> {
    type: 'Feature';
    geometry: {
        type: 'MultiLineString';
        coordinates: ([number, number])[][];
    }
    properties: Properties;
}

export interface WaterPropertiesLin {
    LB: number;
    VERLAUF: string;
}

export interface RiverProperties {
    ADS_ID: number;
    ART_AENDER: string;
    OBJEKTART: string;
    SICHTBARKE: string;
    Symbol: string;
    SHP_Area: number;
    SHP_Length: number;
}

export interface LocationProperties {
    NAME: string;
}