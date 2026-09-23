import { Styles } from "../../../../conf/styles.const";
import { Knockout } from "../../../../util/knockout";
import { ComputedNotNull, Observable } from "../../../../util/knockout/lib/knockout.interface";
import { FeatureCollection } from "../../../../util/services/geojson/geojson-load.service";
import { IntersectionOfPolygonAndLineOptions } from "../../../../util/services/geojson/geojson-to-svg.service";
import { XML } from "../../../../util/services/xml-tag-service";
import { FileNameStringJSON } from "../../../../util/types/template-types/file-name-string.type";
import { svgGDefault } from "../../static/svg-g.factory";
import { SVGSettingObservable } from "../settings/svg-setting.observable";
import { ToSVGable } from "./to-svg-able";

export class SVGCantonBordersObservable extends ToSVGable<'g', 'canton-borders'> {

    public readonly json: Observable<FeatureCollection<unknown>>;
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

    private createXML(json: FeatureCollection<unknown> | undefined): XML<"g"> {
        if (!this.settings.cardElements.showCantonBorders()) {
            return svgGDefault();
        }
        if (json === undefined) {
            this.init();
            return svgGDefault();
        }
        const options: IntersectionOfPolygonAndLineOptions = {
            'fill': 'none',
            'stroke-width': Styles.map["canton-data"]["stroke-width"],
            'stroke': Styles.map["canton-data"].color,
            'stroke-linejoin': 'round'
        }
        return this.geoJSONToSVGService.mapFeatureCollection(json, { id: this.id }, options);
    }

    public get id(): "canton-borders" {
        return 'canton-borders';
    }

    public get idHref(): "#canton-borders" {
        return '#canton-borders';
    }

    public async init(): Promise<void> {
        const json = await this.loadGeoJSON<unknown>('boundaries/geojson-KANTONSGEBIET.poly.json');
        this.json(json);
    }
}
