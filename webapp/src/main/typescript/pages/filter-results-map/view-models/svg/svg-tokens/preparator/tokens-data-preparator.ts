import { FilterDistribution, LocationDistribution, LocationsToFiltersEntry, TokensTableRow } from "../../../../../../client";
import { LocationLevel, LocationPathType } from "../../../../../../models/locations/location.type";
import { MapDataItemErrorState, MapDataItemFactory } from "../../../data/map-data-item.factory";
import { MaxCalculator } from "../../../../../../util/helper/updater/max-calculator";
import { WatchableNotNull } from "../../../../../../util/knockout/lib/knockout.interface";
import { XML } from "../../../../../../util/services/xml-tag-service";
import { FoldParam } from "../../../../../../util/types/stream/async-stream";
import { InterpolationService } from "../../../../services/interpolation.service";
import { SVGPiechartData, SVG_REL_PIECHART_FACTOR } from "../../../../static/svg-piechart.factory";
import { createSVGSymbolIds, createSymbolTagPiechart, createUseTag } from "../../../../static/svg-symbol.factory";
import { DataRepresentationMode } from "../../../settings/svg-setting.observable";
import { AreaColoringResult } from "./area-coloring-result";
import { PerFilterTokensData, TokensData, FactoryAreaColoring } from "./extended-token-item";
import { PieChartResult } from "./pie-chart-result";
import { GeometryData, MapDataItemDataEntry } from "../../../data/map-data-item";
import { LOCATIONS_MAP } from "../../../../../../models/locations/locations-map.const";
import { FilterData } from "../../../settings/filter-data";

const KEY = 'location';

/**
 * This class designs methods for a pipeline to create a token data stream in different states.
 * The upper method is the most specific state.
 * The last method ist the most fundamental state.
 */
export class TokensDataPreparator {

    public readonly tokenItemFactory = new MapDataItemFactory();
    private readonly interpolationService = new InterpolationService();

    constructor(
        public readonly mode: WatchableNotNull<DataRepresentationMode>,
        private readonly locationLevel: WatchableNotNull<LocationLevel>,
        private readonly filters: WatchableNotNull<FilterData[]>,
        private readonly range: { min: WatchableNotNull<number>, max: WatchableNotNull<number> },
        public readonly handleTokenItemErrorState: (state: MapDataItemErrorState) => void,
    ) { }

    public foldToAreaColoringResult(): FoldParam<
        Pick<TokensData, 'geometry' | 'filter' | 'factoryAreaColoring' | 'total'> | undefined,
        AreaColoringResult
    > {
        return {
            folder: async (result: AreaColoringResult, val) => {
                if (!val) {
                    return result;
                }
                result.areaColoringFactories.push(val.factoryAreaColoring.areaFactory.bind(val.factoryAreaColoring))
                result.maxOfTotal.update(val.total);
                return result;
            },
            initial: {
                areaColoringFactories: [],
                maxOfTotal: new MaxCalculator()
            }
        };
    }

    public mapToExtendedTokenItemWithAreaColoring(): (
        tokenItem: Pick<TokensData, 'geometry' | 'filter' | 'total'>
    ) => Promise<Pick<TokensData, 'geometry' | 'filter' | 'total' | 'factoryAreaColoring'> | undefined> {
        return async (tokenItem: Pick<TokensData, 'geometry' | 'filter' | 'total'>) => {
            // Only consider filters that are not explicitly excluded and have a value > 0
            const candidates: PerFilterTokensData[] = tokenItem.filter
                .filter(f => f.considerWhileCreatingAreaColoring() && f.fraction > 0);
            if (!candidates || candidates.length === 0) {
                return undefined;
            }
            // Area coloring
            const dominatingFilter: PerFilterTokensData = candidates.sort((a,b) => b.fraction - a.fraction)[0];
            const total = tokenItem.total;
            const factoryAreaColoring = new FactoryAreaColoring(dominatingFilter, total, tokenItem.geometry, this.range);
            const result: Pick<TokensData, 'geometry' | 'filter' | 'factoryAreaColoring' | 'total'> = {
                ...tokenItem,
                factoryAreaColoring
            };
            return result;
        };
    }

    public foldToPieChartResult(): FoldParam<
        Pick<TokensData, 'geometry' | 'filter' | 'factoryPiechart' | 'total'> | undefined,
        PieChartResult
    > {
        return {
            folder: async (result: PieChartResult, val) => {
                if (val === undefined) {
                    return result;
                }
                result.useList.push(val.factoryPiechart.referenceFactory());
                result.maxOfTotal.update(val.total);
                result.symbolMap.set(
                    val.factoryPiechart.ids.base,
                    val.factoryPiechart.baseDefFactory
                );
                return result;
            },
            initial: {
                useList: [],
                maxOfTotal: new MaxCalculator(),
                symbolMap: new Map<string, (size: number) => XML<"symbol">>()
            }

        };
    }

    public mapToExtendedTokenItemWithPieCharts(): (
        tokenItem: Pick<TokensData, 'geometry' | 'filter' | 'total'>
    ) => Promise<Pick<TokensData, 'geometry' | 'filter' | 'total' | 'factoryPiechart'> | undefined> {
        return async (tokenItem: Pick<TokensData, 'geometry' | 'filter' | 'total'>) => {
            // Drop filters that do not contribute to the chart
            const renderedFilters = tokenItem.filter
                .filter(f => f.considerWhileCreatingPiechart() && f.fraction > 0);
            if (!renderedFilters || renderedFilters.length === 0) {
                return undefined;
            }
            const total = tokenItem.total;
            const piechartData: SVGPiechartData[] = renderedFilters.map(entry => ({
                tokens: entry.fraction,
                volume: Math.round(entry.fraction),
                color: entry.colorPieChart()
            }));
            const [idBase, idHref] = createSVGSymbolIds(tokenItem.total, KEY, piechartData);
            const xmlPiechartFactory = (max: number) => {
                const range = { min: this.range.min(), max: this.range.max() };
                const size = this.interpolationService.interpolate(total, range, max);
                return createSymbolTagPiechart(size, KEY, idBase, piechartData);
            }
            const xmlReferenceFactory = () => createUseTag(tokenItem.geometry, idHref);
            return {
                ...tokenItem,
                factoryPiechart: {
                    ids: {
                        base: idBase,
                        href: idHref
                    },
                    baseDefFactory: xmlPiechartFactory,
                    referenceFactory: xmlReferenceFactory
                }
            }
        };
    }

    /**
     * First pipeline step, creates a partial TokensData item based on `geometry`,
     * the current filter settings from `this.filters()` and the current render
     * mode from `this.mode()`.
     */
    public mapToSimpleExtendedTokenItem():
        (geometry: GeometryData) => Promise<Pick<TokensData, 'geometry' | 'filter' | 'total'>> {
        return async (geometry: GeometryData) => {
            const mode = this.mode();
            const total = (() => {
                switch(mode) {
                    case 'absolut': return geometry.data.totalAbs ?? 0;
                    case 'relative' : return (geometry.data.totalRel ?? 0) * SVG_REL_PIECHART_FACTOR;
                    case 'incidence': return geometry.data.entries.filter(e => e.tokensAbs??0 > 0).length;
                    // This assumes that distances already are in [0..1], and makes sure
                    // that the transparency is set according to the minimum distance (i.e. highest similarity).
                    case 'distribution': return 1 - (Math.min(...geometry.data.entries.map(e => e.distance ?? 1)));
                }
            })();
            function fraction(mode: DataRepresentationMode, entry?: MapDataItemDataEntry): number {
                switch(mode) {
                    case 'absolut': return entry?.tokensAbs ?? 0;
                    case 'relative' : return (entry?.tokensRel ?? 0)  * SVG_REL_PIECHART_FACTOR;
                    case 'incidence': return (entry?.tokensAbs ?? 0) > 0 ? 1 : 0;
                    // This assumes that distances already are in [0..1], and makes sure
                    // that lower similarity results in more transparency.
                    case 'distribution': return 1 - (entry?.distance ?? 1);
                }
            }
            return {
                geometry,
                total,
                filter: this.filters().map((filter: FilterData) => {
                    const entry = geometry.data.entries.find(entry => entry.label === filter.name());
                    const tokens = fraction(this.mode(), entry);
                    const result: PerFilterTokensData = { ...filter, fraction: tokens };
                    return result;
                })
            }
        }
    }

    public filterRemoveErrorStates():
        (val: GeometryData | MapDataItemErrorState, take: (val: GeometryData) => void) => Promise<void> {
        return async (val: GeometryData | MapDataItemErrorState, take: (val: GeometryData) => void) => {
            if (!(typeof val === 'string')) {
                take(val);
            } else {
                this.handleTokenItemErrorState(val);
            }
        };
    }

    public async mapTokensTableRowToDataItemOrError(type: LocationPathType) {
        const locations = await LOCATIONS_MAP.getMap(this.locationLevel(), type);
        return (row: TokensTableRow, existing?: GeometryData) => this.tokenItemFactory.createFromTokensTableRow(row, locations, existing);
    }

    public async mapLocationTypesDistributionToDataItemOrError(type: LocationPathType) {
        const locations = await LOCATIONS_MAP.getMap(this.locationLevel(), type);
        return (entry: LocationDistribution, filters: FilterDistribution[], filterNames: string[], existing?: GeometryData) => this.tokenItemFactory.createFromTypesDistribution(entry, filters, filterNames, locations, existing);
    }

    public async mapLocationToFilterDistanceToDataItemOrError(type: LocationPathType) {
        const locations = await LOCATIONS_MAP.getMap(this.locationLevel(), type);
        return (entry: LocationsToFiltersEntry, filterNames: string[], existing?: GeometryData) => this.tokenItemFactory.createFromLocationEntry(entry, filterNames, locations, existing);
    }
}