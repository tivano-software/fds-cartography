import { Point2 } from "../../util/types/geometry/point2.type";
import { CityRowCSVEntry } from "./city-row-csv-entry.interface";

export interface CityRow extends CityRowCSVEntry {

    readonly geoJSONPos?: Point2;

}