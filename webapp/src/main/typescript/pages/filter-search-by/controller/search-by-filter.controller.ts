import { ExistingNamedFilter, FiltersApi, GetTokensTableLocationsLevelEnum } from "../../../client";
import { API_CONFIG } from "../../../conf/api.const";
import { ConfigDetailDataDetail, SearchParamsModels } from "../../../models/url/search-params.model";
import { GeneralController } from "../../../util/controller/controller.interface";
import { Knockout } from "../../../util/knockout/lib/knockout.interface";
import { StringMapService } from "../../../util/services/string-map.service";
import { URLService } from "../../../util/services/url-service/url.service";
import { Filter } from "../observable/form/form.observable";
import { FilterEntry } from "../observable/ressources/ressources.observable";
import { ViewModelObservable } from "../observable/view-model.observable";
import { SearchQueryStrategyCSV } from "../search-query-strategy/search-query-strategy-csv";
import { SearchQueryStrategyJSON } from "../search-query-strategy/search-query-strategy-json";

export interface SearchByFilterControllerInterface extends GeneralController {
    searchQuery(): void;
}


export class SearchByFilterController implements SearchByFilterControllerInterface {

    private readonly urlService: URLService = new URLService();
    private readonly filterAPI: FiltersApi;

    constructor(private viewModel: ViewModelObservable, private ko: Knockout) {
        this.filterAPI = new FiltersApi(API_CONFIG);
    }

    init(): void {
        this.viewModel.ressources.init();
        this.filterAPI.getAllFilters()
            .then(filters => {
                this.viewModel.ressources.addFilters(filters);
                const paramsOrNull = SearchParamsModels.extractURLParams();
                if (paramsOrNull !== null) {
                    const params = paramsOrNull as ConfigDetailDataDetail;
                    if (params.locationsLevel && params.filterIds) {
                        const locationLevel = params.locationsLevel;
                        const filtersChosen = params.filterIds
                            .map(id => filters.find(filter => filter.id === id))
                            .filter(filter => filter !== undefined)
                            .map(filter => filter as ExistingNamedFilter)
                            .map(filter => ({ id: this.ko.observable(filter.id), name: this.ko.observable(filter.name) }));
                        this.viewModel.form.filters(filtersChosen);
                        this.viewModel.form.tokensTableLocationsLevelValue(locationLevel);
                    } else {
                        throw new Error('Case is not implemented');
                    }
                }
            })
            .catch(error => console.error(error));
    }

    searchQuery(): void {
        const strategy = new SearchQueryStrategyJSON();
        strategy.searchQuery(this.viewModel);
    }

    searchQueryDownload(): void {
        const stringMapService = new StringMapService();
        const filters = this.viewModel.form.filters().map(filter => filter.name() as string);
        const csvTitle = stringMapService.createFilenameByListNotNull(filters, 'export-', 'csv', '_');
        const strategy = new SearchQueryStrategyCSV(csvTitle);
        strategy.searchQuery(this.viewModel);
    }

    openMap(): void {
        const filterIds = this.viewModel.form.filterIds();
        const locationsLevel = this.viewModel.form.tokensTableLocationsLevelValue();
        SearchParamsModels.redirectWithParams(
            'map.html',
            filterIds,
            locationsLevel as GetTokensTableLocationsLevelEnum
        );
    }

    openCluster() {
        const filterIds = this.viewModel.form.filterIds();
        const locationsLevel = this.viewModel.form.tokensTableLocationsLevelValue();
        SearchParamsModels.redirectWithParams(
            'cluster.html',
            filterIds,
            locationsLevel as GetTokensTableLocationsLevelEnum
        );
      }

    addFilter(): void {
        this.viewModel.form.filters.push({
            name: this.ko.observable<string>(undefined),
            id: this.ko.observable<number>(undefined)
        });
    }

    removeFilter(filter: Filter): void {
        this.viewModel.form.filters.remove(filter);
    }

    setFilterData(filterEntry: FilterEntry, filter: Filter): void {
        filter.id(filterEntry.id);
        filter.name(filterEntry.name);
    }

}

export function controllerOf(viewModel: ViewModelObservable, ko: Knockout) {
    return new SearchByFilterController(viewModel, ko);
}
