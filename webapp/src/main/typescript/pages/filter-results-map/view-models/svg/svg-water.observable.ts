import { Settings } from "../../../../conf/settings.const";
import { Knockout } from "../../../../util/knockout";
import { ComputedNotNull, Observable } from "../../../../util/knockout/lib/knockout.interface";
import { Feature, FeatureCollection } from "../../../../util/services/geojson/geojson-load.service";
import { IntersectionOfPolygonAndLineOptions } from "../../../../util/services/geojson/geojson-to-svg.service";
import { XML } from "../../../../util/services/xml-tag-service";
import { FileNameStringJSON } from "../../../../util/types/template-types/file-name-string.type";
import { svgGDefault } from "../../static/svg-g.factory";
import { SVGSettingObservable } from "../settings/svg-setting.observable";
import { ToSVGable } from "./to-svg-able";

export abstract class SVGWaterObservable<Id extends `water-${string}`, Properties> extends ToSVGable<'g', Id> {

    public readonly DEFAULT = svgGDefault();
    public readonly json: Observable<FeatureCollection<Properties>>;
    public readonly toSVG: ComputedNotNull<XML<"g">>;

    constructor(
        readonly ko: Knockout,
        protected readonly ressource: FileNameStringJSON,
        protected readonly settings: SVGSettingObservable,
        private readonly idVal: Id,
        private readonly staticFeatureOptions?: IntersectionOfPolygonAndLineOptions,
        private readonly dynamicOptions?: (feature: Feature<Properties>) => IntersectionOfPolygonAndLineOptions
    ) {
        super(ko);
        this.json = ko.observable(undefined);
        this.toSVG = ko.computed(() => {
            const json = this.json();
            return this.createXML(json, Settings.map.elements.water.defaultOpacity);
        });
    }

    private createXML(json: FeatureCollection<Properties> | undefined, opacity: number): XML<"g"> {
        if (json === undefined) {
            this.init();
            return svgGDefault();
        }
        return this.geoJSONToSVGService.mapFeatureCollection(
            json,
            { id: this.id },
            this.staticFeatureOptions,
            this.dynamicOptions
        );
    }

    public get id(): Id {
        return this.idVal;
    }

    public get idHref(): `#${Id}` {
        return `#${this.idVal}`;
    }

    public async init(): Promise<void> {
        const json = await this.loadGeoJSON<Properties>(this.ressource);
        this.json(json);
    }
}