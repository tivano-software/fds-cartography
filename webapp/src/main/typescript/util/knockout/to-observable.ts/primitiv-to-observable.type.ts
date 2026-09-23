import { Observable, ObservableNotNull } from "../lib/knockout.interface"

export type PrimitivToObservable<A extends bigint | number | boolean | string | symbol> = A extends undefined | infer X ? Observable<X> : ObservableNotNull<A>;