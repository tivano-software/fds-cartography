import { Knockout, Observable } from "..";
import { ObservableNotNull } from "../lib/knockout.interface";

export class PageStateHandler<A> {

    private readonly pageNumberCurrentRaw: ObservableNotNull<number>;
    private readonly itemsPerPageRaw: Observable<number>;
    private readonly listLength: ObservableNotNull<number>;

    constructor(
        ko: Knockout,
        pageCurrent: number,
        private readonly onPageClick: (num: number) => void,
        itemsPerPage?: number,
    ) {
        this.pageNumberCurrentRaw = ko.observable(pageCurrent);
        this.itemsPerPageRaw = ko.observable(itemsPerPage);
        this.listLength = ko.observable(0);
    }

    public setItemsPerPage(itemsPerPage: number | undefined) {
        this.itemsPerPageRaw(itemsPerPage);
    }

    public setPageNumberCurrent(page: number) {
        this.pageNumberCurrentRaw(page);
        this.onPageClick(this.pageNumberCurrentRaw());
    }

    public reset(): void {
        this.pageNumberCurrentRaw(1);
    }

    public next(): void {
        const hasNext = this.hasNextPage();
        if (hasNext) {
            const currentPageNumber = this.pageNumberCurrent();
            this.pageNumberCurrentRaw(currentPageNumber + 1);
            this.onPageClick(this.pageNumberCurrentRaw());
        }
    }

    public before(): void {
        const hasBefore = this.hasBeforePage();
        if (hasBefore) {
            const currentPageNumber = this.pageNumberCurrent();
            this.pageNumberCurrentRaw(currentPageNumber - 1);
            this.onPageClick(this.pageNumberCurrentRaw());
        }
    }

    public hasNextPage(): boolean {
        return this.pageNumberCurrent() < this.pageNumberComplete();
    }

    public hasBeforePage(): boolean {
        return this.pageNumberCurrent() > 1;
    }

    public pageNumberCurrent(): number {
        const pageCurrentRaw = this.pageNumberCurrentRaw();
        if (pageCurrentRaw === undefined) {
            return 1;
        }
        return pageCurrentRaw;
    }

    public itemsPerPage(): number {
        const itemsPerPage = this.itemsPerPageRaw();
        if (itemsPerPage === undefined) {
            return this.listLength();
        }
        return itemsPerPage;
    }

    public itemsComplete(): number {
        return this.listLength();
    }

    public pageNumberComplete(): number {
        const itemsPerPage = this.itemsPerPage();
        return Math.ceil(this.listLength() / itemsPerPage);
    }

    public reduceList(list: A[]): A[] {
        this.listLength(list.length);
        const pageCurrent = this.pageNumberCurrent();
        const itemsPerPage = this.itemsPerPage();
        const indexStart = (pageCurrent - 1) * itemsPerPage;
        const indexEnd = pageCurrent * itemsPerPage;
        return list.slice(indexStart, indexEnd);
    }
}