import { Point2 } from "../../../util/types/geometry/point2.type";

const IMAGE_LOWER_LEFT:  Point2 = [  5.9559020, 45.8179586 ];
const IMAGE_UPPER_RIGHT: Point2 = [ 10.4921719, 47.8084545 ];
const IMAGE_URL: string = 'data/topography.png';
export const SVG_ZOOM_FACTOR = 200;
const SVG_ZOOM_FACTOR_MAX = 10;
const SVG_TRANSFORM_SCALE: Point2 = [ 0.69, -1.0 ];
export const SVG_TRANSFORM_TRANSLATE: Point2 = [ -5,  -47.85 ];

interface MetaData {
    readonly svgZoomFactor: number;
    readonly svgTransformScale: Point2;
    readonly svgTransformTranslate: Point2;
    readonly imageLowerLeft: Point2;
    readonly imageUpperRight: Point2;
    readonly imageUrl: string;
    get image(): {
        width: number;
        height: number;
        x: number;
        y: number;
        transformation: {
            scale: {
                x: number;
                y: number;
            };
        }
    };
    get svg(): {
        transformation: {
            scale: {
                x: number;
                y: number;
            };
            size: {
                scale: number;
            };
            translate: {
                x: number;
                y: number;
            };
        }
    };
}

const X = 0;
const Y = 1;

class MetaDataDefault implements MetaData {
    constructor(
        public readonly svgZoomFactor: number,
        public readonly svgTransformScale: Point2,
        public readonly svgTransformTranslate: Point2,
        public readonly imageLowerLeft: Point2,
        public readonly imageUpperRight: Point2,
        public readonly imageUrl: string,
    ) {}

    get svg(): {
        transformation: {
            scale: { x: number; y: number; };
            size: { scale: number; };
            translate: { x: number; y: number; };
        }
    } {
        return {
            transformation: {
                scale: {
                    x: this.svgTransformScale[X],
                    y: this.svgTransformScale[Y]
                },
                size: {
                    scale: this.svgZoomFactor
                },
                translate: {
                    x: this.svgTransformTranslate[X],
                    y: this.svgTransformTranslate[Y]
                }
            }
        };
    }

    get image(): {
        width: number;
        height: number;
        x: number;
        y: number;
        transformation: { scale: { x: number; y: number; } };
    } {
        const height = Math.abs(this.imageUpperRight[Y] - this.imageLowerLeft[Y]);
        const width = Math.abs(this.imageUpperRight[X] - this.imageLowerLeft[X]);
        return {
            x: this.imageLowerLeft[X],
            y: -this.imageUpperRight[Y],
            height,
            width,
            transformation: {
                scale: {
                    x: 1,
                    y: -1,
                }
            }
        };
    }
}

export function META_DATA(
    zoom: number,
    transformTranslate: Point2
): MetaData {
    const metaData = new MetaDataDefault(
        zoom,
        SVG_TRANSFORM_SCALE,
        createTansformTranslate(transformTranslate),
        IMAGE_LOWER_LEFT,
        IMAGE_UPPER_RIGHT,
        IMAGE_URL
    );
    return metaData;
}

function createTansformTranslate(transformTranslate: Point2): Point2 {
    return [(transformTranslate[0]), (transformTranslate[1])];
}

export function createZoom(zoom: number): number {
    const min = SVG_ZOOM_FACTOR;
    const max = SVG_ZOOM_FACTOR_MAX * SVG_ZOOM_FACTOR;
    return createBounded(zoom, max, min);
}

function createBounded(val: number, max: number, min: number): number {
    if (val < min) {
        return min;
    }
    if (val > max) {
        return max;
    }
    return val;
}