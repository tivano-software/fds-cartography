import { FunctionToObservable } from "./function-to-observable.type";
import { PrimitivToObservable } from "./primitiv-to-observable.type";


export type ObjectToObservable<A extends object> =  {
        readonly [S in keyof A]-?:
            A[S] extends bigint | number | boolean | string | symbol ? PrimitivToObservable<A[S]> :
            A[S] extends undefined | infer X ? (
                X extends object ? ObjectToObservable<X> :
                never
            ) :
            A[S] extends undefined ? undefined :
            A[S] extends (...args: any[]) => any[] ? FunctionToObservable<A[S]> :
            never;
    };