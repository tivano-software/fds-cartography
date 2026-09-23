import { URLCustomService } from "../../util/services/url-service/url-custom.service";
import { ifSet } from "../../util/types/then-catch/if-set.function";

export type SortBy = 'id' | 'title' | 'editor' | 'creator';

export interface FilterOverviewParamsModel {
    readonly sortBy: SortBy;
    readonly orderBy: 'ASC' | 'DESC';
    readonly page: number;
    readonly term: string;
}

export const FILTER_OVERVIEW_PARAMS_MODEL = new URLCustomService<FilterOverviewParamsModel>(
    'filter-overview.html',
    {
        sortBy: (value) => ifSet(value).orDefault('').toLowerCase() as SortBy,
        orderBy: (value) => {
            if (value === 'ASC' || value === 'DESC') {
                return value;
            }
            throw 'can\'t map orderBy.';
        },
        page: (value) => {
            if (value === undefined || value === null) {
                throw `can't map page.`;
            }
            return +value;
        },
        term: (value) => value ?? ""
    },
    {
        sortBy: (val) => val.toString(),
        orderBy: (val) => val.toString(),
        page: (val) => val + "",
        term: (val) => val.toString(),
    }
);