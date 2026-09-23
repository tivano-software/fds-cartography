import { Feature, LocationProperties } from "../../util/services/geojson/geojson-load.service";
import { Point2 } from "../../util/types/geometry/point2.type";
import { LocationData } from "./location-data.interface";

export class LocationDataFactory {

    public readonly create = (feature: Feature<LocationProperties>): LocationData => ({
        coordinates: this.extractCoordinates(feature),
        geoJSON: feature,
    });

    private readonly extractCoordinates = (feature: Feature<LocationProperties>): Point2[][]  => {
        try {
            return feature.geometry.type == 'Point'
                ? [[feature.geometry.coordinates]]
                : feature.geometry.coordinates as Point2[][];
        } catch (exception) {
            throw new Error(`Can't map feature. ${exception}. ${JSON.stringify(feature)}.`);
        }
    }

}
