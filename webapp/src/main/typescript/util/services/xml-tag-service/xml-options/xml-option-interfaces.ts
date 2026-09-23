import { Color } from "../../../types/color/color.type";
import { Size } from "../../../types/template-types/size.type";
import { URLPrefixString } from "../../../types/template-types/file-name-string.type";

export interface XMLRectangleOptions {
    'height'?: Size,
    'width'?: Size,
    'x'?: number,
    'y'?: number
}

export interface XMLOpacityOptions {
    opacity?: number;
}

export interface XMLSVGOptions {
    'xmlns:xlink'?: URLPrefixString;
    'xmlns:tei'?: URLPrefixString;
    'xmlns'?: URLPrefixString;
    'xmlns:ch'?: URLPrefixString;
    'preserveAspectRatio'?: string;
}

export interface XMLClippath {
    'clip-path'?: `url(#${string})`;
}

export interface XMLTransformOptions {
    'transform'?: string;
}

export interface XMLBaseOptions<IdString extends string> {
    'id'?: IdString;
    'class'?: string;
    'overflow'?: 'visible';
    'style'?: string;
    'display'?: boolean;
    'font-family'?: string;
}

export interface XMLViewBoxOptions {
    'viewBox': string;
}
export interface XMLHrefOptions {
    href: string;
}

export interface XMLColorFillOptions {
    'fill'?: Color;
    'fill-opacity'?: number;
}

export interface XMLTextOptions {
    'dominant-baseline'?: 'auto' | 'text-bottom' | 'alphabetic' | 'ideographic' | 'middle' | 'central' | 'mathematical' | 'hanging' | 'text-top' | 'text-after-edge' | 'text-before-edge'
    'dy'?: number,
    'dx'?: number,
    'font-size'?: string;
}

export interface XMLCircleOptions {
    'cx': number;
    'cy': number;
    'r': number;
}

export interface SVGPolygonOptions {
    'points': string;
}

export interface SVGPathOptions {
    'd': string;
}

export type XMLStrokeOptionsDasharray = string;

export interface XMLStrokeOptions {
    'stroke-linecap'?: number;
    'stroke-linejoin'?: "arcs" | "bevel" | "miter" | "miter-clip" | "round"
    'stroke-miterlimit'?: number;
    'stroke-width'?: number | `${number}%`;
    'stroke'?: Color;
    'stroke-opacity'?: number;
    'stroke-dasharray'?: XMLStrokeOptionsDasharray;
}

export interface VectorEffectOption {
    // Never use this. It destroys the svg in InDesign.
    'vector-effect'?: never;
}
