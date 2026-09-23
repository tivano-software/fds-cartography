import { Color } from "../util/types/color/color.type";

export interface StylesInterface {
    readonly map: {
        readonly legend: {
            borderColor: Color;
            borderSize: number;
        };
        readonly piecharts: {
            readonly rows: Color[][];
            readonly palette: Color[];
        };
        readonly border: {
            readonly 'color': Color;
            readonly 'stroke-width': number;
        };
        readonly "canton-data": {
            readonly 'color': Color;
            readonly 'stroke-width': number;
            readonly 'font-size': number;
        };
        readonly water: {
            readonly 'color': Color;
            readonly 'stroke-width': (factor: number) => number;
        };
    };
}