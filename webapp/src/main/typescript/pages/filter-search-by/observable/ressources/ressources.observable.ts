import { ExistingNamedFilter, GetTokensTableInnerGroupEnum, GetTokensTableLocationsLevelEnum, GetTokensTableOuterGroupEnum, GetTokensTableTypesLevelEnum } from "../../../../client";
import { Computed, Knockout, Observable, ObservableArray } from "../../../../util/knockout";
import { UndefinedNullableService } from "../../../../util/services/undefined-nullable.service";

export interface FilterEntry {
    id: number | undefined;
    name: string | undefined;
}

export class RessourcesObservable {

    tokenTableInnerGroupValues: ObservableArray<GetTokensTableInnerGroupEnum>;
    tokenTableOuterGroupValues: ObservableArray<GetTokensTableOuterGroupEnum>;
    tokensTableLocationsLevels: ObservableArray<GetTokensTableLocationsLevelEnum>;
    tokensTableTypesLevels: ObservableArray<GetTokensTableTypesLevelEnum>;
    filterList: ObservableArray<FilterEntry>;
    filterListSearchString: Observable<string>;
    filteredFilterList: Observable<FilterEntry[]>;

    constructor(private ko: Knockout) {
        const undefinedNullableService = new UndefinedNullableService();
        const comporator = (entry1: FilterEntry, entry2: FilterEntry) => undefinedNullableService.compareStrings(
            entry1.name,
            entry2.name
        );
        this.tokenTableInnerGroupValues = ko.observableArray<GetTokensTableInnerGroupEnum>([]);
        this.tokenTableOuterGroupValues = ko.observableArray<GetTokensTableOuterGroupEnum>([]);
        this.tokensTableLocationsLevels = ko.observableArray<GetTokensTableLocationsLevelEnum>([]);
        this.tokensTableTypesLevels = ko.observableArray<GetTokensTableTypesLevelEnum>([]);
        this.filterListSearchString = ko.observable(undefined);
        const allFilters = ko.observableArray<FilterEntry>([]);
        const filteredFilterList: Observable<FilterEntry[]> = ko.observable([]);
        let debounceTimer: number | undefined = undefined;
        function updateFilteredFilterList(key: string | undefined) {
            if (key) {
                const matcher = new RegExp(key, "i");
                const matchedFilters = allFilters().filter(value => value.name?.match(matcher));
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => filteredFilterList(matchedFilters), 100);
            } else {
                filteredFilterList([]);
            }
        }
        this.filteredFilterList = filteredFilterList;
        this.filterList = allFilters;
        this.filterListSearchString.subscribe(updateFilteredFilterList);
        this.filterList.subscribe(_ => updateFilteredFilterList(this.filterListSearchString()));
    }

    addFilter(filter: ExistingNamedFilter): void {
        this.filterList.push({
            name: filter.name,
            id: filter.id
        });
    }

    addFilters(filters: ExistingNamedFilter[]): void {
        const entries = filters.map(filter => { return { name: filter.name, id: filter.id }});
        this.filterList.push(...entries);
    }

    init(): void {
        Object.keys(GetTokensTableInnerGroupEnum).forEach(val => {
            this.tokenTableInnerGroupValues.push(val as GetTokensTableInnerGroupEnum);
        });
        Object.keys(GetTokensTableOuterGroupEnum).forEach(val => {
            this.tokenTableOuterGroupValues.push(val as GetTokensTableOuterGroupEnum);
        });
        Object.keys(GetTokensTableLocationsLevelEnum).forEach(val => {
            this.tokensTableLocationsLevels.push(val as GetTokensTableLocationsLevelEnum);
        });
        Object.keys(GetTokensTableTypesLevelEnum).forEach(val => {
            this.tokensTableTypesLevels.push(val as GetTokensTableTypesLevelEnum);
        });
    }
}