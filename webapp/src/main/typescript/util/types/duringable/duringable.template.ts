import { Observable } from "../../knockout";
import { ObservableNotNull } from "../../knockout/lib/knockout.interface";
import { Duringable, Untilable } from "./duringable.interface";


export abstract class DuringableTemplate implements Duringable {

    on<A>(mode: 'fail' | 'success', promise: Promise<A>): Untilable {
        const after = new Promise<void>((resolve) => {
            switch (mode) {
                case 'fail':
                    promise.catch(() => {
                        this.initialize();
                        resolve();
                    });
                    break;
                case 'success':
                    promise.then(() => {
                        this.initialize();
                        resolve();
                    });
                    break;
            }
        })
        return {
            until: async <A>(on: Promise<A> | (() => A)): Promise<A> => {
                return after.then(() => {
                    return handle(on, () => this.finalize());
                });
            }
        };
    }

    show(): void {
        this.initialize();
    }

    async until<A>(on: Promise<A> | (() => A)): Promise<A> {
        this.initialize();
        return handle(on, () => this.finalize());
    }

    whileTrue(observable: Observable<boolean> | ObservableNotNull<boolean>): void {
        if (observable()) {
            this.initialize();
        }
        observable.subscribe((val) => {
            if (val) {
                this.initialize();
            } else {
                this.finalize();
            }
        });
    }

    whileFalse(observable: Observable<boolean>  | ObservableNotNull<boolean>): void {
        if (!observable()) {
            this.initialize();
        }
        observable.subscribe((val) => {
            if (!val) {
                this.initialize();
            } else {
                this.finalize();
            }
        });
    }

    abstract initialize(): void;
    abstract finalize(): void;
}


function handle<A>(on: Promise<A> | (() => A), finalize: () => void): Promise<A> {
    if (typeof on === 'function') {
        const procedure = on;
        let result: A;
        try {
            result = procedure();
        } catch(error) {
            finalize();
            throw error;
        }
        finalize();
        return new Promise((resolve) => resolve(result));
    }
    const promise = on;
    promise.then(() => finalize());
    promise.catch(() => finalize());
    return promise;
}