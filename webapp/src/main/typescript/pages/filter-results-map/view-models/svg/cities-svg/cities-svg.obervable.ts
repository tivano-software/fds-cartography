import { ComputedNotNull, Knockout, ObservableArray } from "../../../../../util/knockout/lib/knockout.interface";
import { XML, XMLTagService } from "../../../../../util/services/xml-tag-service";
import { CityRowLoadService } from "../../../../../models/cities/city-row.load.service";
import { SVGSettingObservable } from "../../settings/svg-setting.observable";
import { ToSVGable } from "../to-svg-able";
import { CitiesIdType } from "./cities-svg.id.type";
import { CitiesId } from "./cities-svg.id.const";
import { ToHref } from "../../../../../util/types/template-types/to-href.type";
import { toHref } from "../../../../../util/types/template-types/to-href.function";
import { DeepReadonly } from "../../../../../util/types/util-types/partial-types/deep-readonly.type";
import { CityRowRequired } from "../../../../../models/cities/city-row.required.type";
import { CitySvgFactory } from "./city-svg.factory";
import { SvgCity } from "./city-svg.type";
import { TRANSFORM_SYMBOL } from "../../../static/svg-symbol.factory";
import { XMLSymbol } from "../../../../../util/services/xml-tag-service/xml-types/xml.type";

export class CitiesSVGObservable {

    private readonly xmlTagService = new XMLTagService();
    private readonly loadCityService = new CityRowLoadService();
    private readonly citySvgFactory = new CitySvgFactory();

    public readonly cities: ObservableArray<CityRowRequired>;
    public readonly toSVG: ComputedNotNull<[XML<"g">, XMLSymbol]>;

    public constructor(
        public readonly ko: Knockout,
        public readonly settings: SVGSettingObservable
    ) {
        this.cities = ko.observableArray<CityRowRequired>([]);
        this.toSVG = this.ko.computed((): [XML<"g">, XMLSymbol] => {
            const [id, idHref] = this.citySvgFactory.createSymbolIds();
            const symbol = this.citySvgFactory.createSymbol(id, 3);
            const threshold: number = this.settings.cities.threshold();
            const childs: XML<'use'>[] = this.cities()
                .filter(city => city.displayLevel <= threshold)
                .map(city => this.citySvgFactory.createUse(
                    city.geoJSONPos[0],
                    city.geoJSONPos[1],
                    idHref, city.name));
            const use = this.xmlTagService.create('g', {
                options: { id: this.id }, childs
            });
            return [use, symbol]
        });
    }

    public get id(): CitiesIdType {
        return CitiesId;
    }

    public get idHref(): ToHref<CitiesIdType> {
        return toHref(CitiesId);
    }

    public async init(): Promise<void> {
        const cities = await this.loadCityService.loadCities();
        this.cities(cities);
        //cities.forEach(city => this.cities.push(city));
    }

}