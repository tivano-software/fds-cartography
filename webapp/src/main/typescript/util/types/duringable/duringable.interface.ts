import { Observable } from "../../knockout";
import { ObservableNotNull } from "../../knockout/lib/knockout.interface";

export interface Untilable {
    until<A>(promise: Promise<A>): Promise<A>;
    until<A>(procedure: (() => A)): Promise<A>;
}

export interface Duringable extends Untilable {
    on<A>(mode: PromiseState, promise: Promise<A>): Untilable;
    whileTrue(observable: Observable<boolean> | ObservableNotNull<boolean>): void;
    whileFalse(observable: Observable<boolean> | ObservableNotNull<boolean>): void;
    show(): void;
}

export type PromiseState = 'fail' | 'success';