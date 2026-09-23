import { XML, XMLTagService } from "../../../util/services/xml-tag-service";
import { XMLTagMetadataContent } from "../../../util/services/xml-tag-service/xml-tag.type";
import { GeometryData } from "../view-models/data/map-data-item";
import { svgCircle } from "./svg-circle.factory";
import { svgPiechart, SVGPiechartData } from "./svg-piechart.factory";

export type SymbolId = `symbol-${string}`;
export type SymbolIdHref = `#symbol-${string}`;

export const TRANSFORM_SYMBOL = "scale(1.4285714285714286 -1) scale(0.01)";

export function createSVGSymbolIds(size: number, key: string, piechartData: SVGPiechartData[]): [ SymbolId, SymbolIdHref ] {
    const suffix = !piechartData ? '' : '-vals=' + piechartData.map(d => `${d.color.replace("#", "")}:${d.tokens}`).join('_');
    const symbolId: SymbolId = `symbol-key-${key}-size=${size}${suffix}`;
    const symbolIdHref: SymbolIdHref = `#${symbolId}`;
    return [symbolId, symbolIdHref];
}

export function createSymbolTagCircle(
    size: number,
    key: string,
    id: SymbolId,
): XML<"symbol"> {
    const xmlTagService = new XMLTagService();
    const circle = svgCircle(size, key);
    return xmlTagService.create('symbol', {
        options: {
            id: id,
            overflow: 'visible'
        },
        childs: [
            xmlTagService.create('g', {
                options: {
                    'transform': TRANSFORM_SYMBOL,
                },
                childs: [circle]
            })
         ]
    });
}


export function createSymbolTagPiechart(
    size: number,
    key: string,
    id: SymbolId,
    metaInfos: SVGPiechartData[]
): XML<"symbol"> {
    const xmlTagService = new XMLTagService();
    const piechart = svgPiechart(size, key, metaInfos);
    return xmlTagService.create('symbol', {
        options: {
            id: id,
            overflow: 'visible'
        },
        childs: [
            xmlTagService.create('g', {
                options: {
                    'transform': TRANSFORM_SYMBOL,
                },
                childs: [piechart]
            })
         ]
    });
}

export function createUseTag(
    val: GeometryData,
    idHref: SymbolIdHref
): XML<"use"> {
    const xmlTagService = new XMLTagService();
    const isEmpty = val.data.entries.length === 0;
    return xmlTagService.create('use', {
        options: {
            'xlink:href': idHref,
            'x': val.geometry.x,
            'y': val.geometry.y,
            'data-toggle': 'tooltip',
            'data-placement': 'top',
            'title': val.label
        },
        childs: [
            xmlTagService.create('metadata', {
                childs: [
                    xmlTagService.create('ch:location', {
                        value: val.label
                    }),
                    xmlTagService.create('ch:absolut', {
                        value: val.data.totalAbs + ''
                    }),
                    xmlTagService.create('ch:relativ', {
                        value: val.data.totalRel + ''
                    }),
                    xmlTagService.create('ch:entries', {
                        childs: val.data.entries.map(val => {
                            let details: XML<XMLTagMetadataContent>[] = [
                                xmlTagService.create('ch:token', {
                                    value: val.label
                                })
                            ];
                            if (val.tokensAbs !== undefined) {
                                details.push(xmlTagService.create('ch:absolut', { value: `${val.tokensAbs}`}));
                            }
                            if (val.tokensRel !== undefined) {
                                details.push(xmlTagService.create('ch:relativ', { value: `${val.tokensRel}`}));
                            }
                            if (val.distance !== undefined) {
                                details.push(xmlTagService.create('ch:distance', { value: `${val.distance}`}));
                            }
                            return xmlTagService.create('ch:entry', { childs: details});
                        })
                    }),
                ]
            })
        ]
    });
}