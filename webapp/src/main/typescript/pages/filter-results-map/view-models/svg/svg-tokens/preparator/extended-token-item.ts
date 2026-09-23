import { WatchableNotNull } from "../../../../../../util/knockout/lib/knockout.interface";
import { XML } from "../../../../../../util/services/xml-tag-service";
import { InterpolationService } from "../../../../services/interpolation.service";
import { createAreaColoring } from "../../../../static/svg-area-coloring.factory";
import { SymbolId, SymbolIdHref } from "../../../../static/svg-symbol.factory";
import { GeometryData } from "../../../data/map-data-item";
import { FilterData } from "../../../settings/filter-data";

export class FactoryAreaColoring {

    private readonly interpolationService = new InterpolationService();

    constructor(
        private filter: PerFilterTokensData,
        private volume: number,
        private geometry: GeometryData,
        private readonly range: { min: WatchableNotNull<number>, max: WatchableNotNull<number> },
    ) {}

    public areaFactory(max: number): XML<'g'> {
        const range = { min: this.range.min(), max: this.range.max() };
        const opacity = this.interpolationService.interpolate(this.volume, range, max);
        const color = this.filter.colorAreaColoring();
        return createAreaColoring(this.geometry, color, opacity);
    }
}

/**
 * Represents tokens data rendered at a specific location on the map at a specific step within a
 * TokensDataPreparator pipeline.
 * This interface is not used directly - instead, at each step of the pipeline, types representing
 * the specific input and output data for that step are constructed by piccking the relevant properties
 * with `Pick<TokensData, ...>`. In particular, there will never be a concrete instance that has both
 * a `factoryPiechart` and `factoryAreaColoring` properties.
 */
export interface TokensData {
    readonly geometry: (GeometryData);
    readonly total: number,
    readonly filter: PerFilterTokensData[];
    readonly factoryPiechart: {
        readonly ids: {
            readonly base: SymbolId;
            readonly href: SymbolIdHref;
        };
        readonly baseDefFactory: (size: number) => XML<"symbol">;
        readonly referenceFactory: () => XML<"use">;
    };
    readonly factoryAreaColoring: FactoryAreaColoring,
}

/**
 * Represents the fraction of the total data value at a location that
 * is rendered with specific filter settings.
 *
 * Note: The sum of all `fraction` values at a location is *not* necessary
 * equal to `total` for that location. In fact, it will typically be less
 * than `total` for relative mode (because `total` here also includes the
 * part of the population not matched by any of the type filters) and greater
 * than `total` in distribution mode (because in distribtion mode `total`
 * is meaningless and arbitrarily set to 1)
 */
export interface PerFilterTokensData extends FilterData {
    readonly fraction: number;
}

