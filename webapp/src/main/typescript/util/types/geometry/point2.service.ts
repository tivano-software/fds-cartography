import { Point2 } from "./point2.type";

export class Point2Service {

    public readonly extract = (axis: 'x' | 'y', point: Point2) => point[this.index(axis)];

    public readonly index = (axis: 'x' | 'y') : 0 | 1 => axis == 'x' ? 0 : 1;

}