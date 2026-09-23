import { QueryApi } from "../../../../../client";
import { API_CONFIG } from "../../../../../conf/api.const";
import { Settings } from "../../../../../conf/settings.const";
import { LocationLevel, LocationPathType } from "../../../../../models/locations/location.type";
import { timeout } from "../../../../../util/helper/timeout/timeout";
import { Knockout } from "../../../../../util/knockout";
import { MessagingHandler } from "../../../../../util/messaging";
import { AsyncStreamI } from "../../../../../util/types/stream/async-stream";
import { AsyncStreamFactory } from "../../../../../util/types/stream/async-stream.factory";
import { GeometryData } from "../../data/map-data-item";
import { isMapDataItem } from "../../data/map-data-item.factory";
import { FilterData } from "../../settings/filter-data";
import { TokensDataPreparator } from "./preparator/tokens-data-preparator";
import { locationsToFilterDistancesRequest, tokenTablesRequest } from "./tokens-table-request.factory";

export type MapDataArrayContext = 'Tortendiagramme' | 'Fl\u00e4chenf\u00e4rbung';

export class MapDataArray {
    private readonly queryApi = new QueryApi(API_CONFIG);

    private dataItemsByLocation: Record<string, GeometryData> = {};
    private tokensDataInitialized: boolean = false;
    private distributionDataInitialized: boolean = false;

    constructor(
        private readonly ko: Knockout,
        private readonly messageHandler: MessagingHandler,
        private readonly context: MapDataArrayContext,
        private readonly pathType: LocationPathType,
        private locationLevel:  LocationLevel,
        private filters: FilterData[]
    ) {}

    public async update(locationLevel:  LocationLevel, filters:  FilterData[], preparator: TokensDataPreparator): Promise<AsyncStreamI<GeometryData>> {
        const locationLevelChanged = locationLevel !== this.locationLevel;
        const filtersChanged = filters !== this.filters;
        if (locationLevelChanged || filtersChanged) {
            this.locationLevel = locationLevel;
            this.filters = filters;
            this.dataItemsByLocation = {};
            this.tokensDataInitialized = false;
            this.distributionDataInitialized = false;
            this.messageHandler.clearAll();
        }
        const mode = preparator.mode();
        if (mode === 'distribution' && !this.distributionDataInitialized) {
            this.dataItemsByLocation = await this.loadData(this.tokensDistributionLoader(preparator, this.dataItemsByLocation));
            this.distributionDataInitialized = true;
        }
        if (mode !== 'distribution' && !this.tokensDataInitialized) {
            this.dataItemsByLocation = await this.loadData(this.tokensDataLoader(preparator, this.dataItemsByLocation));
            this.tokensDataInitialized = true;
        }
        let items: GeometryData[] = Object.keys(this.dataItemsByLocation).map(key => this.dataItemsByLocation[key]);
        if (this.context === 'Tortendiagramme') {
            // piecharts expect data to be sorted by totalAbs/totalRel (depending on mode)
            const relative = mode ==='relative';
            items = items.sort((item1, item2) => {
                const val1: number | undefined = relative ? item1.data.totalRel : item1.data.totalAbs;
                const val2: number | undefined = relative ? item2.data.totalRel : item2.data.totalAbs;
                return (val2 ?? 0) - (val1 ?? 0);
            })

        }
        return AsyncStreamFactory.ofList(items);
    }

    private async loadData(promise: Promise<Record<string, GeometryData>>): Promise<Record<string, GeometryData>> {
        this.messageHandler.registerNavbarInfo('spinner', `Lade ${this.context}...`).until(promise);
        this.messageHandler.registerNavbarInfo('success', `${this.context} geladen`, 'success')
            .on('success', promise)
            .until(timeout(Settings.general.messaging["show-duration"]));
        this.messageHandler.registerNavbarInfo('fail', `Fehler (${this.context})`, 'danger')
            .on('fail', promise);
        const result = await promise;
        return result;
    }

    private async tokensDistributionLoader(preparator: TokensDataPreparator, existing: Record<string, GeometryData>): Promise<Record<string, GeometryData>> {
        const filtersString = this.filters.map(val => val.id()).join(',');
        const requestParameters = locationsToFilterDistancesRequest(filtersString, this.locationLevel);
        const createDataItem = await preparator.mapLocationToFilterDistanceToDataItemOrError(this.pathType)
        const filterNames: string[] = [];
        this.filters.forEach(filter => filterNames[filter.id()] = filter.name());
        const promise = new Promise<Record<string, GeometryData>>((resolve, reject) => {
            this.queryApi.getLocationsToFiltersDistanceMatrix(requestParameters).then(distribution => {
                let result: Record<string, GeometryData> = {}
                const distances = distribution.data;
                if (distances) {
                    distances.forEach(entry => {
                        const label = entry.location;
                        if (label) {
                            const candidate = createDataItem(entry, filterNames, existing[label]);
                            if (isMapDataItem(candidate)) {
                                result[candidate.label] = candidate;
                            } else {
                                preparator.handleTokenItemErrorState(candidate);
                            }
                        } else {
                            preparator.handleTokenItemErrorState('LOCATION_LABEL_IS_EMPTY');
                        }
                    });
                } else {
                    preparator.handleTokenItemErrorState('FILTER_DATA_IS_MISSING')
                }
                resolve(result);
            });
        });
        return promise;
    }

    private async tokensDataLoader(preparator: TokensDataPreparator, existing: Record<string, GeometryData>): Promise<Record<string, GeometryData>> {
        const filtersString = this.filters.map(val => val.id()).join(',');
        const requestParameters = tokenTablesRequest(filtersString, this.locationLevel);
        const createDataItem = await preparator.mapTokensTableRowToDataItemOrError(this.pathType)
        const promise = new Promise<Record<string, GeometryData>>((resolve, reject) => {
            this.queryApi.getTokensTable(requestParameters).then(tokensTable => {
                let result: Record<string, GeometryData> = {}
                tokensTable.forEach(row => {
                    const candidate = createDataItem(row, existing[row.label??""]);
                    if (isMapDataItem(candidate)) {
                        result[candidate.label] = candidate;
                    } else {
                        preparator.handleTokenItemErrorState(candidate);
                    }
                });
                resolve(result);
            });
        });
        return promise;
    }
}
