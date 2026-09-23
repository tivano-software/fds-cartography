import { Clearable } from "../types/clearable/clearable.interface";
import { Computed, Knockout, Observable, ObservableArray } from "../knockout";
import { MessagedPredicate } from "./predicate.interface";
import { Validable } from "./validable.interface";
import { Validator } from "./validator.interface";


export interface ValidableObservable<A> extends Observable<A>, Validable, Clearable {
    isError: Computed<boolean>;
    error: Observable<string>;
    predicates: ObservableArray<MessagedPredicate<A>>;
}

export function validable<A>(
    ko: Knockout,
    a: A | undefined,
    predicateList: MessagedPredicate<A>[]
): ValidableObservable<A> {
    const observable = ko.observable(a) as ValidableObservable<A>;
    observable.error = ko.observable<string>(undefined);
    observable.predicates = ko.observableArray(predicateList);
    observable.getValidator = () => new ValidatorForValidableObservable(observable);
    observable.isError = ko.computed(() => observable.error() !== undefined);
    observable.clear = () => {
        observable.error(undefined);
        observable(undefined);
    };
    return observable;
}

class ValidatorForValidableObservable<A> implements Validator {

    constructor(private observable: ValidableObservable<A>) { }

    validate(): boolean {
        for (var key in this.predicatesOfObservable()) {
            const predicate = this.predicatesOfObservable()[key];
            const val = this.observable();
            const valid = predicate.predicate(val);
            if (!valid) {
                this.errorOfObservable(predicate.message);
                return false;
            }
        }
        return true;
    }
    error(): string[] {
        const error = this.errorOfObservable();
        return error === undefined ? [] : [error];
    }

    clearErrors(): void {
        this.errorOfObservable(undefined);
    }

    get predicatesOfObservable(): ObservableArray<MessagedPredicate<A>> {
        return this.observable.predicates;
    }

    get errorOfObservable(): Observable<string> {
        return this.observable.error;
    }
}