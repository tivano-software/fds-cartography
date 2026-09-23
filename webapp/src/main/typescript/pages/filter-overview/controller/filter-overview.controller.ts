import { FiltersApi, NamedFilter } from "../../../client";
import { FILTER_OVERVIEW_PARAMS_MODEL } from "../../../models/url/filter-overview-params.model";
import { GeneralController } from "../../../util/controller/controller.interface";
import { Knockout } from "../../../util/knockout/lib/knockout.interface";
import { MessagingHandler } from "../../../util/messaging";
import { Comporator } from "../../../util/types";
import { ifSet } from "../../../util/types/then-catch/if-set.function";
import { OptionalizeExplicit } from "../../../util/types/util-types/accessor-types/optionalize-explicit.type";
import { Unoptionalize } from "../../../util/types/util-types/accessor-types/unoptionalize.type";
import { FilterItemObservable } from "../observable/filter-item.observable";
import { FilterOverviewObservable } from "../observable/filter-overview.observable";
import { comparator } from "../../../util/helper/list/sort-by";
import { API_CONFIG } from "../../../conf/api.const";
import { CopyNameCreator } from "../../../util/helper/copy/copy-name-creator";


export class FilterOverviewController implements GeneralController {

    private filtersApi: FiltersApi;
    private readonly copyNameCreator = new CopyNameCreator();

    constructor(
        private ko: Knockout,
        private filterOverviewObservable: FilterOverviewObservable
    ) {
        this.filtersApi = new FiltersApi(API_CONFIG);
    }

    search(): void {
        const input = this.filterOverviewObservable.searchInput();
        const inputClean = ifSet(input).orDefault('');
        this.filterOverviewObservable.search(inputClean);
        FILTER_OVERVIEW_PARAMS_MODEL.updateURLParamsByObject<'term'>({
            term: inputClean,
        });
    }

    init(): void {
        const urlParams = FILTER_OVERVIEW_PARAMS_MODEL.loadURLParamsByObject();
        if (urlParams === null) {
            FILTER_OVERVIEW_PARAMS_MODEL.createURLParamsByObject({
                page: 1,
                sortBy: "id",
                orderBy: "DESC",
                term: "",
            }).open();
        } else {
            this.filterOverviewObservable.clear();
            this.filterOverviewObservable.searchInput(urlParams.term);
            this.search();
            try {
                this.sort(urlParams.sortBy as unknown as 'id' | 'title' | 'editor' | 'creator', urlParams.orderBy);
            } catch (exception) {
                return;
            }
            this.filtersApi.getAllFilters().then(filters => {
                this.filterOverviewObservable.add(filters);
                this.filterOverviewObservable.filterList.getPageState().setPageNumberCurrent(urlParams.page);
                try {
                    this.filterOverviewObservable.setPage(urlParams.page);
                } catch (exception) {
                    return;
                }
            }).catch(error => console.error(error));
        }
    }

    private criteria: 'id' | 'title' | 'editor' | 'creator' = 'id';
    private orderBy: 'ASC' | 'DESC' = 'DESC';
    public toggleSort(criteria: 'id' | 'title' | 'editor' | 'creator'): void {
        if (criteria === this.criteria) {
            this.orderBy = this.orderBy === 'ASC' ? 'DESC' : 'ASC';
        } else {
            this.criteria = criteria;
            this.orderBy = 'DESC';
        }
        FILTER_OVERVIEW_PARAMS_MODEL.updateURLParamsByObject<'orderBy' | 'sortBy'>({
            orderBy: this.orderBy,
            sortBy: this.criteria
        });
        this.sort(this.criteria, this.orderBy);
    }

    private sort(criteria: 'id' | 'title' | 'editor' | 'creator' | 'lastEdited', orderBy: 'ASC' | 'DESC'): void {
        const comp = ((): Comporator<FilterItemObservable> => {
            switch(criteria) {
                case 'id': return comparator<number, FilterItemObservable>('number', orderBy, x => x.id());
                case 'title': return comparator<string, FilterItemObservable>('string', orderBy, x => x.title());
                case 'editor': return comparator<string, FilterItemObservable>('string', orderBy, x => x.lastEditor());
                case 'creator': return comparator<string, FilterItemObservable>('string', orderBy, x => x.initialAuthor());
                case 'lastEdited': return comparator<Date, FilterItemObservable>('date', orderBy, x => x.lastEditedAt());
            }
        })();
        this.filterOverviewObservable.filterList.setSortStrategy(comp);
    }

    delete(item: FilterItemObservable) {
        const okay = window.confirm("Der Eintrag wird endg\u00fcltig gel\u00f6scht. Sind Sie sicher?");
        if (okay) {
            this.filtersApi.deleteNamedFilter({
                id: item.id() as number
            }).then(sucess => this.init()).catch(error => console.error(error));
        }
    }

    copy(item: FilterItemObservable) {
        this.filterOverviewObservable.getMessagingHandler().clearAll();
        const catchCopying = function(handler: MessagingHandler, onCreation: boolean) {
            let msg = "Das Kopieren des Filters war nicht m\u00f6glich.";
            if (onCreation) {
                msg += " Es existiert bereits eine Kopie mit diesem Namen."
            }
            handler.registerError(msg).show();
        };
        this.filtersApi.getFilterByID({
            id: item.id() as number
        }).then(result => {
            const newName = this.copyNameCreator.createNewName(result.name as string);
            const namedFilter: OptionalizeExplicit<Unoptionalize<NamedFilter>, ['filter', 'description']> = {
                name: newName,
                filter: result.filter,
                editable: true,
                description: result.description,
            };
            this.filtersApi.createNamedFilter({ namedFilter }).then(result => {
                this.init();
                const msg = "Der Filter '" + newName + "' wurde angelegt."
                this.filterOverviewObservable.getMessagingHandler().registerSuccess(msg).show();
            }).catch(error => catchCopying(this.filterOverviewObservable.getMessagingHandler(), true));
        }).catch(error => catchCopying(this.filterOverviewObservable.getMessagingHandler(), false));
    }

}

export function createFilterOverviewController(ko: Knockout, observable: FilterOverviewObservable): FilterOverviewController {
    return new FilterOverviewController(ko, observable);
}