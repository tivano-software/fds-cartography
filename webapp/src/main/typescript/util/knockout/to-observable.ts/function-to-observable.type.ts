import { Computed, ComputedNotNull } from "../lib/knockout.interface"

export type FunctionToObservable<A extends (...args: any[]) => any[]> =
    A extends () => infer Result ? (
        A extends undefined
        ? Computed<Result>
        : ComputedNotNull<Result>
    ) : A;