import { Computed, Knockout, Observable } from "../../knockout";
import { PageStateHandler } from "../../knockout/list/page-state-handler.observable";
import { Clearable } from "../clearable/clearable.interface";
import { Comporator } from "../comporator/comporator";
import { MapObservableInterface } from "./map.interface";
import { MapObservable } from "./map.observable";

export class MapDoubleKeyObservable<Key1, Key2, Value> implements Clearable {
    private readonly map: MapObservableInterface<Key1, MapObservableInterface<Key2, Observable<Value>>>;
    private readonly keys2: MapObservableInterface<Key2, Key2>;
    public readonly keys1Prepared: Computed<Key1[]>;
    public readonly keys2Prepared: Computed<Key2[]>;
    public readonly isEmpty: Computed<boolean>;

    constructor(private ko: Knockout) {
        this.map = new MapObservable(this.ko);
        this.keys2 = new MapObservable(this.ko);
        this.keys1Prepared = ko.computed(() => this.map.keys.getPrepared());
        this.keys2Prepared = ko.computed(() => this.keys2.keys.getPrepared());
        this.isEmpty = ko.computed<boolean>(() => this.map.isEmpty());
    }

    public setSortComporatorKey1(comporator: Comporator<Key1>): void {
        this.map.keys.setSortStrategy(comporator);
    }

    public setSortComporatorKey2(comporator: Comporator<Key2>): void {
        this.keys2.keys.setSortStrategy(comporator);
    }

    public clear(): void {
        this.map.forEach((value, key) => {
            value.clear();
        });
        this.map.clear();
        this.keys2.clear();
    }

    public contains(key1: Key1, key2?: Key2): boolean {
        const map1 = this.map.get(key1);
        if (map1 === undefined) {
            return false;
        }
        if (key2 === undefined) {
            return true;
        }
        const map2 = map1.get(key2);
        return map2 !== undefined;
    }

    public getOrCreate(key1: Key1, key2: Key2, defaultValue: Value): Observable<Value> {
        const map = this.getOrCreateMap(key1);
        const val = map.getOrCreate(key2, this.ko.observable<Value>(defaultValue));
        return val;
    }

    public getOrCreateMap(key1: Key1): MapObservableInterface<Key2, Observable<Value>> {
        let map = this.map.get(key1);
        if (map === undefined) {
            map = new MapObservable<Key2, Observable<Value>>(this.ko);
            this.map.set(key1, map);
        }
        return map;
    }

    public set(key1: Key1, key2: Key2, value: Value): Observable<Value> {
        const map = this.getOrCreateMap(key1);
        const val = map.getOrCreate(key2, this.ko.observable<Value>(undefined));
        this.keys2.set(key2, key2);
        val(value);
        return val;
    }

    public delete(key1: Key1, key2: Key2): void {
        this.map.delete(key1);
        this.keys2.delete(key2);
    }

    public getPageStateHandler1(): PageStateHandler<Key1> {
        return this.map.getPageStateHandler();
    }

    public getPageStateHandler2(): PageStateHandler<Key2> {
        return this.keys2.keys.getPageState();
    }
}