import { Knockout } from "../../../util/knockout/lib/knockout.interface";
import {
    Messageable,
    MessagingHandler,
    MessagingObservable,
} from "../../../util/messaging";
import { Clearable } from "../../../util/types/clearable/clearable.interface";
import { FormDataObservable } from "./form/form.observable";
import { RessourcesObservable } from "./ressources/ressources.observable";
import { ResultTableObservable } from "./result-table.ts/result-table.observable";


export class ViewModelObservable implements ViewModelObservable, Clearable {

    readonly messages: MessagingObservable;
    readonly ressources: RessourcesObservable;
    readonly form: FormDataObservable;
    readonly table: ResultTableObservable;

    constructor(ko: Knockout) {
        this.messages = new MessagingObservable(ko);
        this.ressources = new RessourcesObservable(ko);
        this.form = new FormDataObservable(ko, this.getMessagingHandler());
        this.table = new ResultTableObservable(ko, this.form.filtersFilteredNotNull);
    }

    public clear(): void {
        this.getMessagingHandler().clearAll();
        this.form.clear();
        this.table.clear();
    }

    public clearResults(): void {
        this.getMessagingHandler().clearAll();
        this.table.clear();
    }

    public getMessagingHandler(): MessagingHandler {
        return new MessagingHandler(this.messages);
    }

}

export function createViewModel(ko: Knockout): ViewModelObservable {
    return new ViewModelObservable(
        ko
    );
}