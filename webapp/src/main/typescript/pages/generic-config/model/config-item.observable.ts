import { Observable, ObservableNotNull } from "../../../util/knockout/lib/knockout.interface";

export interface ConfigItemObservable {
    readonly id: ObservableNotNull<number>;
    readonly title: ObservableNotNull<string>;
    readonly initialAuthor: ObservableNotNull<string>;
    readonly lastEditor: ObservableNotNull<string>;
    readonly createdAt: Observable<Date>;
    readonly lastEditedAt: Observable<Date>;
}