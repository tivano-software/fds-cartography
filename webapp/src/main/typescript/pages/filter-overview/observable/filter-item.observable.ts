import { Observable } from "../../../util/knockout";


export interface FilterItemObservable {
    readonly id: Observable<number>;
    readonly title: Observable<string>;
    readonly initialAuthor: Observable<string>;
    readonly lastEditor: Observable<string>;
    readonly lastEditedAt: Observable<Date>;
    readonly description: Observable<string>;
}