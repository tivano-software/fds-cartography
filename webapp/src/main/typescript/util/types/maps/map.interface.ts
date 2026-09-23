import { Computed } from "../../knockout";
import { ExtendedListObservable } from "../../knockout/list/extended-list.observable";
import { PageStateHandler } from "../../knockout/list/page-state-handler.observable";
import { Clearable } from "../clearable/clearable.interface";


export interface MapObservableInterface<Key, Value> extends Clearable {
    readonly keys: ExtendedListObservable<Key>;
    readonly isEmpty: Computed<boolean>
    get(key: Key): Value | undefined;
    getOrCreate(key: Key, defaultValue: Value): Value;
    set(key: Key, value: Value): Value;
    forEach(callbackfn: (value: Value, key: Key) => void, thisArg?: any): void;
    delete(key: Key): void;
    getPageStateHandler(): PageStateHandler<Key>;
}