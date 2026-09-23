import { XMLTagService } from "../../../../../util/services/xml-tag-service";
import { XMLOptionsContainer } from "../../../../../util/services/xml-tag-service/xml-types/xml-options-container.type";
import { XML, XMLSymbol } from "../../../../../util/services/xml-tag-service/xml-types/xml.type";
import { SymbolId, SymbolIdHref, TRANSFORM_SYMBOL } from "../../../static/svg-symbol.factory";
import { SvgCity } from "./city-svg.type";

export const CITY_CLASS = 'CITY_CLASS_53cab9841f9f0253e0ba1ab38337910c7930d98d';

export class CitySvgFactory {

    private static readonly CITY_SYMBOL_ID = 'city'
    private readonly xmlTagService = new XMLTagService();

    public readonly createSymbolIds = (): [SymbolId, SymbolIdHref] => ((id: SymbolId) => [id, `#${id}`])(`symbol-${CitySvgFactory.CITY_SYMBOL_ID}`);


    public readonly createSymbol = (id: SymbolId, size: number, overflow: 'visible' | undefined = 'visible'): XMLSymbol => this.xmlTagService.create('symbol', {
        options: {
            id,
            overflow
         },
        childs: [
            this.xmlTagService.create('g', {
                options: {
                    'transform': TRANSFORM_SYMBOL,
                },
                childs: [this.create(size)]
            })
        ]
    });

    public readonly createUse = (x: number, y: number, idHref: SymbolIdHref, citiy: string): XML<"use"> => this.xmlTagService.create('use', {
        options: {
            'xlink:href': idHref,
            x,
            y,
            class: CITY_CLASS
        },
        childs: [
            this.xmlTagService.create('metadata', {
                childs: [
                    this.xmlTagService.create('ch:city', {
                        value: citiy,
                    })
                ]
            })
        ]
    });


    public readonly create = (size: number): SvgCity => this.xmlTagService.create('path', this.createOptions(size));


    private readonly createOptions = (size: number): XMLOptionsContainer<'path'> => {
        const p = size/2.0;
        return {
            options: {
                'd': `M ${-p} ${-p} L ${-p} ${p} L ${p} ${p} L ${p} ${-p} Z`,
                'fill': 'none',
                'stroke': "black",
                'stroke-width': size * 0.167,
            }
        }
    };
}