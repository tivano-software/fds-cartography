import { Settings } from "../../../conf/settings.const";
import { createGlobalTransform, XML, XMLTagService, XMLTag, XMLTagBase } from "../../../util/services/xml-tag-service";
import { XMLTagForms } from "../../../util/services/xml-tag-service/xml-tag.type";
import { Point2 } from "../../../util/types/geometry/point2.type";
import { META_DATA } from "./meta.data";

export const SVG_FRAME_ID = 'svg-frame';

export function reduceRecursive<A, R>(vals: A[], getChilds: ((val: A) => A[] | undefined), callback: (acc: R, val: A) => R, init: R): R {
    return vals.reduce<R>((r: R, val: A): R => {
        const childs = getChilds(val);
        if (childs) {
            const childResult = reduceRecursive(childs, getChilds, callback, r);
            return callback(childResult, val);
        }
        return callback(r, val);
    }, init);
}

export function svgFrame(
    childs: XML<XMLTagBase | XMLTagForms>[],
    defs: XML<'defs'>,
    zoom: number,
    transformTranslate: Point2,
): XML<XMLTag>[] {
    const metaData = META_DATA(zoom, transformTranslate);
    const xmlTagService = new XMLTagService();
    const highestChilds: XML<XMLTag>[] = [];

    highestChilds.push(xmlTagService.create('style', {
        value: `.standardFont {
            font-family: Arial, sans-serif; !important
            font-size: 24px; !important
         }`
    }));
    highestChilds.push(defs);
    highestChilds.push(xmlTagService.create('g', {
        options: {
            id: 'map-content',
            transform: createGlobalTransform([metaData.svg.transformation]),
        },
        childs: [
            xmlTagService.create('g', {
                options: {
                    'stroke-width': 0.010752688172043012
                },
                childs: childs
            })
        ]
    }));


    return highestChilds;
}