import { Duringable } from "../types/duringable/duringable.interface";
import { DuringableTemplate } from "../types/duringable/duringable.template";
import { ObservableArray } from "../knockout/lib/knockout.interface";
import { Validable } from "../validation";
import { MessagingObservable } from "./messaging.observable";
import { MessagingNavbarTypes, MessagingState } from "./messaging-navbar.types";

class MessagingDuringable<A> extends DuringableTemplate {

    constructor(private message: A, private array: ObservableArray<A>) {
        super();
    }

    finalize(): void {
        this.array.remove(this.message);
    }

    initialize(): void {
        this.array.push(this.message);
    }
}

export class MessagingHandler implements MessagingHandler {
    constructor(private observable: MessagingObservable) {}

    removeSuccess(message: string): void {
        this.observable.successListContainer.remove(message);
    }

    removeInfo(message: string): void {
        this.observable.infoListContainer.remove(message);
    }

    removeError(message: string): void {
        this.observable.errorListContainer.remove(message);
    }

    registerNavbarInfo(
        type: MessagingNavbarTypes,
        info: string | undefined = undefined,
        state: MessagingState = 'info'
    ): Duringable {
        return new MessagingDuringable({
            type,
            info,
            state
        }, this.observable.navbarMessagesContainer);
    }

    registerInfo(message: string): Duringable {
        return new MessagingDuringable(message, this.observable.infoListContainer);
    }

    registerSuccess(message: string): Duringable {
        return new MessagingDuringable(message, this.observable.successListContainer);
    }

    registerError(message: string): Duringable {
        return new MessagingDuringable(message, this.observable.errorListContainer);
    }

    clearAll(): void {
        this.clearErrors();
        this.clearSuccess();
        this.clearInfo();
    }

    clearSuccess(): void {
        this.observable.successListContainer.removeAll();
    }

    clearInfo(): void {
        this.observable.infoListContainer.removeAll();
    }

    clearErrors(): void {
        this.observable.validable()?.getValidator().clearErrors();
        this.observable.errorListContainer.removeAll();
    }

    registerValidator(validable: Validable): void {
        this.observable.validable(validable);
    }
}