import { Styles } from "../../../../conf/styles.const";
import { Knockout } from "../../../../util/knockout";
import { ComputedNotNull, Observable } from "../../../../util/knockout/lib/knockout.interface";
import { Feature, FeatureCollection, Point } from "../../../../util/services/geojson/geojson-load.service";
import { XML } from "../../../../util/services/xml-tag-service";
import { XMLBaseOptions, XMLColorFillOptions, XMLRectangleOptions, XMLStrokeOptions, XMLTextOptions } from "../../../../util/services/xml-tag-service/xml-options/xml-option-interfaces";
import { svgGDefault } from "../../static/svg-g.factory";
import { TRANSFORM_SYMBOL } from "../../static/svg-symbol.factory";
import { SVGSettingObservable } from "../settings/svg-setting.observable";
import { ToSVGable } from "./to-svg-able";

export class SVGCantonNamesObservable extends ToSVGable<'g', 'canton-names'> {

    public readonly json: Observable<FeatureCollection<{NAME: string}>>;
    public readonly toSVG: ComputedNotNull<XML<"g">>;

    constructor(
        ko: Knockout,
        private readonly settings: SVGSettingObservable
    ) {
        super(ko);
        this.json = ko.observable(undefined);
        this.toSVG = ko.computed(() => {
            const json = this.json();
            return this.createXML(json);
        });
    }

    private createXML(json: FeatureCollection<{NAME: string}> | undefined): XML<"g"> {
        if (!this.settings.cardElements.showCantonNames()) {
            return svgGDefault();
        }
        if (json === undefined) {
            this.init();
            return svgGDefault();
        }
        const options : XMLBaseOptions<'canton-names'> & XMLColorFillOptions & XMLTextOptions = {
            'id': 'canton-names',
            'fill': Styles.map["canton-data"].color,
            'class': "standardFont",
            'font-size': Styles.map["canton-data"]["font-size"] + "px"
        }
        const children: XML<'g'>[] = json.features
            .filter(feature => isPoint(feature))
            .map(feature => {
                return {
                    tag: 'g',
                    options: {
                        transform: "translate(" + feature.geometry.coordinates[0] + " " + feature.geometry.coordinates[1] + ")"
                    },
                    childs: [{
                        tag: 'text',
                        value: feature.properties.NAME,
                        options: {
                            transform: TRANSFORM_SYMBOL,
                            x: 0,
                            y: 0
                        }
                    }]
                };
            });
        return {
            tag: 'g',
            childs: children,
            options
        };
    }

    public get id(): "canton-names" {
        return 'canton-names';
    }

    public get idHref(): '#canton-names' {
        return '#canton-names';
    }

    public async init(): Promise<void> {
        const json = await this.loadGeoJSON<{NAME: string}>('geojson-canton-names.json');
        this.json(json);
    }
}

function isPoint<P>(feature: Feature<P>): feature is Point<P> {
    return feature.geometry.type == 'Point'
}