import { MapConfigModels } from "../../../models/url/map-config.model";
import { Knockout, ObservableNotNull } from "../../../util/knockout/lib/knockout.interface";
import { extendedList, ExtendedListObservable } from "../../../util/knockout/list/extended-list.observable";
import { MessagingHandler, MessagingObservable } from "../../../util/messaging";
import { SearchService } from "../../../util/services/search.service";
import { ConfigItemObservable } from "./config-item.observable";

export class ConfigObervable {

    public readonly list: ExtendedListObservable<ConfigItemObservable>;
    public readonly messages: MessagingObservable;
    public readonly searchInput: ObservableNotNull<string>;

    public constructor(private readonly ko: Knockout) {
        this.list = extendedList<ConfigItemObservable>(ko, [], {
            itemsPerPage: 20,
            onPageClick: (num) => {
                MapConfigModels.updatePageURL(
                    'filter-overview.html',
                    num
                );
            }
        });
        this.messages = new MessagingObservable(ko);
        this.searchInput = ko.observable('');
    }

    public getMessagingHandler(): MessagingHandler {
        return new MessagingHandler(this.messages);
    }

    public search(search: string): void {
        const searcher = new SearchService();
        const predicate = searcher.createFilterPredicate(search, new Map([
            ['id', (a: ConfigItemObservable) => `${a.id()}`],
            ['title', (a: ConfigItemObservable) => `${a.title()}`],
            ['editor', (a: ConfigItemObservable) => `${a.lastEditor()}`],
            ['creator', (a: ConfigItemObservable) => `${a.initialAuthor()}`],
        ]));
        this.list.setFilterPredicate(predicate);
    }
}

export function createConfigObervable(ko: Knockout): ConfigObervable {
    return new ConfigObervable(ko);
}