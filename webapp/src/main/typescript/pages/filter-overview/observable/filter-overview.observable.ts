import { ExistingNamedFilter } from "../../../client";
import { FILTER_OVERVIEW_PARAMS_MODEL } from "../../../models/url/filter-overview-params.model";
import { Knockout, Observable } from "../../../util/knockout/lib/knockout.interface";
import { extendedList, ExtendedListObservable } from "../../../util/knockout/list/extended-list.observable";
import { MessagingHandler, MessagingObservable } from "../../../util/messaging";
import { SearchService } from "../../../util/services/search.service";
import { comparator } from "../../../util/helper/list/sort-by";
import { FilterItemObservable } from "./filter-item.observable";

export class FilterOverviewObservable {
    filterList: ExtendedListObservable<FilterItemObservable>;
    messages: MessagingObservable;
    searchInput: Observable<string>;

    constructor(private ko: Knockout) {
        this.filterList = extendedList<FilterItemObservable>(ko, [], {
            itemsPerPage: 20,
            onPageClick: (num) => {
                FILTER_OVERVIEW_PARAMS_MODEL.updateURLParamsByObject<'page'>({
                    page: num
                });
            }
        });
        this.messages = new MessagingObservable(ko);
        this.searchInput = ko.observable('');
    }

    public setPage(page: number) {
        this.filterList.getPageState().setPageNumberCurrent(page);
    }

    search(search: string): void {
        const searcher = new SearchService();
        const predicate = searcher.createFilterPredicate(search, new Map([
            ['id', (a: FilterItemObservable) => `${a.id()}`],
            ['title', (a: FilterItemObservable) => `${a.title()}`],
            ['editor', (a: FilterItemObservable) => `${a.lastEditor()}`],
            ['creator', (a: FilterItemObservable) => `${a.initialAuthor()}`],
            ['description', (a: FilterItemObservable) => `${a.description()}`],
        ]));
        this.filterList.setFilterPredicate(predicate);
    }

    getMessagingHandler(): MessagingHandler {
        return new MessagingHandler(this.messages);
    }

    clear(): void {
        this.filterList.removeAll();
    }

    add(filters: ExistingNamedFilter[]) : void {
        this.filterList.push(... filters.map(filter => {
            return {
                title: this.ko.observable(filter.name),
                id: this.ko.observable(filter.id),
                initialAuthor: this.ko.observable(filter.initialAuthor?.email),
                lastEditor: this.ko.observable(filter.lastEditor?.email),
                lastEditedAt: this.ko.observable(filter.lastEditedAt),
                description: this.ko.observable(filter.description ?? undefined),
            }
        }));
    }
}

export function createFilterOverviewObservable(ko: Knockout): FilterOverviewObservable {
    return new FilterOverviewObservable(ko);
}