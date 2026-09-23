import { GetTokensTableInnerGroupEnum, GetTokensTableLocationsLevelEnum, GetTokensTableTypesLevelEnum, GetTokensTableOuterGroupEnum } from "../../../../client";
import { Settings } from "../../../../conf/settings.const";
import { LocationLevel } from "../../../../models/locations/location.type";
import { Computed, Knockout, Observable, ObservableArray } from "../../../../util/knockout";
import { AttributesToObservableNotNull, ComputedNotNull, ObservableNotNull, toObservableNotNull } from "../../../../util/knockout/lib/knockout.interface";
import { MessagingHandler } from "../../../../util/messaging";
import { Clearable } from "../../../../util/types/clearable/clearable.interface";

export interface Filter {
    id: Observable<number>;
    name: Observable<string>;
}

export type FilterNotNull = AttributesToObservableNotNull<Filter>;

export class FormDataObservable implements Clearable {
    public readonly tokensTableInnerGroupValue: ObservableNotNull<GetTokensTableInnerGroupEnum>;
    public readonly tokensTableOuterGroupValue: ObservableNotNull<GetTokensTableOuterGroupEnum>;
    public readonly tokensTableLocationsLevelValue: ObservableNotNull<LocationLevel>;
    public readonly tokensTableTypesLevelValue: ObservableNotNull<GetTokensTableTypesLevelEnum>;
    public readonly filters: ObservableArray<Filter>;
    public readonly filtersFilteredNotNull: ComputedNotNull<FilterNotNull[]>;
    public readonly filterIds: ComputedNotNull<number[]>;

    constructor(private ko: Knockout, private messageHandler: MessagingHandler) {
        const definedFilterIds = () => {
            return this.filters().map(filter => filter.id()).filter(id => id !== undefined) as number[];
        };
        this.filters = ko.observableArray<Filter>([]);
        this.filtersFilteredNotNull = ko.computed<FilterNotNull[]>(() => {
            const filtersFilteredNotNull: FilterNotNull[] = [];
            this.filters().forEach(filter => {
                const id = toObservableNotNull(filter.id);
                const name = toObservableNotNull(filter.name);
                if (id !== null && name !== null)
                    filtersFilteredNotNull.push({ id, name })
            });
            return filtersFilteredNotNull;
        });
        this.filterIds = ko.computed<number[]>(definedFilterIds);
        this.tokensTableInnerGroupValue = ko.observable<GetTokensTableInnerGroupEnum>(Settings.query.defaultInnerGroup);
        this.tokensTableOuterGroupValue = ko.observable<GetTokensTableOuterGroupEnum>(Settings.query.defaultOuterGroup);
        this.tokensTableLocationsLevelValue = ko.observable<LocationLevel>(Settings.query.defaultLocationLevel);
        this.tokensTableTypesLevelValue = ko.observable<GetTokensTableTypesLevelEnum>(Settings.query.defaultTypesLevel);
        this.initSubscriptions();
    }

    get chosenFilterIds(): number[] {
        return this.filterIds();
    }

    clear(): void {
        this.filters([]);
    }

    initSubscriptions(): void {
        this.tokensTableInnerGroupValue.subscribe(value => {
            if (
                value === GetTokensTableInnerGroupEnum.LOCATIONS
                && this.tokensTableOuterGroupValue() === GetTokensTableOuterGroupEnum.LOCATIONS
            ) {
                this.tokensTableOuterGroupValue(GetTokensTableOuterGroupEnum.TYPES);
            }
            if (
                value === GetTokensTableInnerGroupEnum.TYPES
                && this.tokensTableOuterGroupValue() === GetTokensTableOuterGroupEnum.TYPES
            ) {
                this.tokensTableOuterGroupValue(GetTokensTableOuterGroupEnum.LOCATIONS);
            }
        });
        this.tokensTableOuterGroupValue.subscribe(value => {
            if (
                value === GetTokensTableOuterGroupEnum.LOCATIONS
                && this.tokensTableInnerGroupValue() === GetTokensTableInnerGroupEnum.LOCATIONS
            ) {
                this.tokensTableInnerGroupValue(GetTokensTableInnerGroupEnum.TYPES);
            }
            if (
                value === GetTokensTableOuterGroupEnum.TYPES
                && this.tokensTableInnerGroupValue() === GetTokensTableInnerGroupEnum.TYPES
            ) {
                this.tokensTableInnerGroupValue(GetTokensTableInnerGroupEnum.LOCATIONS);
            }
        });
    }
}