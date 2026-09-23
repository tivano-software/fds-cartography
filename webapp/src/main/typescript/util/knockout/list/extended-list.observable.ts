import { Computed, Knockout, Observable, ObservableArray } from "../lib/knockout.interface";
import { Nullable } from "../../services/undefined-nullable.service";
import { Predicate } from "../../validation/predicate.interface";
import { Comporator } from "../../types";
import { PageStateHandler } from "./page-state-handler.observable";

export interface SortStrategyChain<A> extends Comporator<A> {
    sortStrategyChild?: Nullable<SortStrategyChain<A>>;
}

export interface ExtendedListObservableOptions<A> {
    pageCurrent?: number;
    itemsPerPage?: number;
    onPageClick?: (page: number) => void;
}

export interface ExtendedListObservable<A> extends ObservableArray<A> {
    sortStrategy: Observable<SortStrategyChain<A>>;
    filterPredicate: Observable<Predicate<A>>;
    pageState: Observable<PageStateHandler<A>>;

    /**
     * Returns a sorted, filtered and paged list.
     */
    getPrepared: Computed<A[]>;
    setFilterPredicate(predicate: Predicate<A>): void;
    getFilterPredicate(): Predicate<A>;
    setSortStrategy(strategy: Comporator<A>): void;
    getSortStrategy(): Comporator<A>;
    getPageState(): PageStateHandler<A>;
}

/**
 * Since ExtendedListObservable implements the ObservableArray interface.
 * Instances of this interface cannot be built as an explicit implementation.
 * The following method constructs the class by initializing all properties.
 *
 * @param ko Current Knockout Instance.
 * @param values to create the initial list.
 * @returns A list which implements the getPrepared method. This method returns a list that filters, sorts and paged.
 */
export function extendedList<A>(ko: Knockout, values: A[], options?: ExtendedListObservableOptions<A>): ExtendedListObservable<A> {
    const predAll = (a: A) => true;
    const noSort = (v1: A, v2: A) => 0;
    const itemsPerPage = options !== undefined ? options.itemsPerPage : undefined;
    const pageCurrent = options !== undefined && options.pageCurrent !== undefined ? options.pageCurrent : 1;
    const onPageClick = options !== undefined && options.onPageClick !== undefined ? options.onPageClick : (num: number) => {};
    const noPaging = new PageStateHandler<A>(ko, pageCurrent, onPageClick, itemsPerPage);
    var list: ExtendedListObservable<A>;
    list = (ko.observableArray<A>(values) as ExtendedListObservable<A>);
    /**
     * Init paging
     */
    list.pageState = ko.observable<PageStateHandler<A>>(noPaging);
    list.getPageState = () => {
        const pageState = list.pageState();
        return pageState as PageStateHandler<A>;
    };
    /**
     * Init filter
     */
    list.filterPredicate = ko.observable<Predicate<A>>(predAll);
    list.setFilterPredicate = (predicate: Predicate<A>) => {
        list.filterPredicate(predicate);
        list.getPageState().reset();
    };
    list.getFilterPredicate = (): Predicate<A> => {
        const pred = list.filterPredicate();
        if (pred === undefined) {
            return predAll;
        }
        return pred;
    };
    /**
     * Init sort
     */
    list.sortStrategy = ko.observable<SortStrategyChain<A>>(noSort);
    list.setSortStrategy = (newstrategy: Comporator<A>) => {
        const oldSortStrategyChain = list.getSortStrategy();
        const newSortStrategyChain: SortStrategyChain<A> = (newstrategy as SortStrategyChain<A>);
        newSortStrategyChain.sortStrategyChild = oldSortStrategyChain;
        list.sortStrategy(newstrategy);
        list.getPageState().reset();
    };
    list.getSortStrategy = () => {
        const strat = list.sortStrategy();
        if (strat === undefined) {
            return noSort;
        }
        return strat;
    };
    /**
     * Init prepared
     */
    list.getPrepared = ko.computed<A[]>(() => {
        const pageState = list.pageState() !== undefined
            ? list.pageState()
            : noPaging;
        const comparator = list.getSortStrategy();
        const predicate = list.getFilterPredicate();
        const listFiltered = list().filter(predicate);
        const listSorted = listFiltered.sort(comparator);
        const listPaged = (pageState as PageStateHandler<A>).reduceList(listSorted);
        return listPaged;
    });
    return list;
}