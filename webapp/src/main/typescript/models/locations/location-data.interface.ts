import { Feature, LocationProperties } from "../../util/services/geojson/geojson-load.service";
import { Point2 } from "../../util/types/geometry/point2.type";

export interface LocationData {
    readonly coordinates: Point2[][];
    readonly geoJSON: Feature<LocationProperties>;
}