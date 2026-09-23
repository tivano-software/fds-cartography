import { XMLClippath, XMLHtml, XMLStyle, XMLTag, XMLTagMetadata, XMLTagMetadataContent } from "../xml-tag.type";
import { XMLBaseOptions, XMLRectangleOptions, XMLViewBoxOptions, XMLSVGOptions, XMLHrefOptions, XMLTransformOptions, XMLOpacityOptions, SVGPathOptions, XMLStrokeOptions, XMLColorFillOptions, SVGPolygonOptions, XMLCircleOptions, XMLTextOptions, VectorEffectOption } from "../xml-options/xml-option-interfaces";
import { Size } from "../../../types/template-types/size.type";

export type XMLOptionsContainer<Tag extends XMLTag> =
    Tag extends 'svg' ? {
        options: XMLRectangleOptions
        & XMLViewBoxOptions
        & XMLBaseOptions<`svg-${string}`>
        & XMLSVGOptions
    } :
    Tag extends 'image' ? {
        options: XMLHrefOptions
        & XMLRectangleOptions
        & XMLBaseOptions<`image-${string}`>
        & XMLTransformOptions
        & XMLOpacityOptions
    } :
    Tag extends 'path' ? {
        options: SVGPathOptions
        & XMLBaseOptions<string>
        & XMLStrokeOptions
        & XMLTransformOptions
        & XMLColorFillOptions
        & VectorEffectOption
    } :
    Tag extends 'polygon' ? {
        options: SVGPolygonOptions
        & XMLBaseOptions<string>
        & XMLStrokeOptions
        & XMLTransformOptions
        & XMLColorFillOptions
        & VectorEffectOption
    } :
    Tag extends 'g' ? {
        options?: XMLTransformOptions
        & XMLBaseOptions<string>
        & XMLStrokeOptions
        & XMLRectangleOptions
    } :
    Tag extends 'clipPath' ? {
        options: XMLBaseOptions<`clipPath-${string}`>
        & XMLTransformOptions
        & XMLBaseOptions<string>
        & XMLStrokeOptions
        & XMLRectangleOptions
    } :
    Tag extends 'symbol' ? {
        options: XMLBaseOptions<`symbol-${string}`>
    } :
    Tag extends 'rect' ? {
        options: XMLBaseOptions<`rect-${string}`>
        & XMLStrokeOptions
        & XMLTransformOptions
        & XMLRectangleOptions
        & XMLColorFillOptions
        & VectorEffectOption
    } :
    Tag extends 'circle' ? {
        options: XMLBaseOptions<`circle-${string}`>
        & XMLStrokeOptions
        & XMLTransformOptions
        & XMLCircleOptions
        & XMLColorFillOptions
        & VectorEffectOption
    } :
    Tag extends 'text' ? {
        options: XMLBaseOptions<`rect-${string}`>
        & XMLStrokeOptions
        & XMLTransformOptions
        & XMLRectangleOptions
        & XMLColorFillOptions
        & XMLTextOptions
    } :
    Tag extends 'a' ? {
        options: {
            href: string
        }
    } :
    Tag extends 'use' ? {
        options: {
            'xlink:href'?: `#symbol-${string}`,
            'href'?: `#${string}`,
            'data-toggle'?: 'tooltip'
            'data-placement'?: 'top',
            'title'?: string,
        }
        & XMLRectangleOptions & XMLBaseOptions<string>
    } :
    Tag extends 'defs' ? {
        options: XMLBaseOptions<`defs-${string}`>
    } :
    Tag extends 'foreignObject' ? {
        options: {
            'width': Size,
            'height': Size,
            'x': number,
            'y': number,
        }
    } :
    Tag extends XMLHtml ? {} :
    Tag extends XMLStyle ? {} :
    Tag extends XMLTagMetadata | XMLTagMetadataContent ? {} :
    never;