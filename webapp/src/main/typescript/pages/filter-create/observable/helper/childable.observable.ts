import { ObservableArray } from "../../../../util/knockout";

export interface ChildableObservable<A> {
    childs: ObservableArray<A>;
    add(child: A): void;
    getChilds(): A[];
}