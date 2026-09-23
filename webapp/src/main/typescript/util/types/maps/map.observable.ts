import { Computed, Knockout } from "../../knockout";
import { extendedList, ExtendedListObservable } from "../../knockout/list/extended-list.observable";
import { PageStateHandler } from "../../knockout/list/page-state-handler.observable";
import { MapObservableInterface } from "./map.interface";


export class MapObservable<Key, Value> implements MapObservableInterface<Key, Value> {

    private map: Map<Key, Value>;
    public readonly keys: ExtendedListObservable<Key>;
    public readonly isEmpty: Computed<boolean>;

    constructor(ko: Knockout) {
        this.map = new Map<Key, Value>();
        this.keys = extendedList<Key>(ko, []);
        this.isEmpty = ko.computed(() => this.keys().length === 0);
    }

    public get(key: Key): Value | undefined {
        return this.map.get(key);
    }

    public getOrCreate(key: Key, defaultValue: Value): Value {
        const val = this.get(key);
        if (val === undefined) {
            return this.set(key, defaultValue);
        }
        return val;
    }

    public set(key: Key, value: Value): Value {
        const inner = this.get(key);
        this.map.set(key, value);
        if (inner === undefined) {
            this.keys.push(key);
        }
        return value;
    }

    public delete(key: Key): void {
        this.map.delete(key);
        this.keys.remove(key);
    }

    public forEach(callbackfn: (value: Value, key: Key) => void, thisArg?: any): void {
        this.map.forEach(callbackfn, thisArg);
    }

    public clear(): void {
        this.map.clear();
        this.keys.removeAll();
    }

    public getPageStateHandler(): PageStateHandler<Key> {
        return this.keys.pageState() as PageStateHandler<Key>;
    }
}