import { Knockout } from "../../../util/knockout";
import { Messageable, MessagingHandler, MessagingObservable } from "../../../util/messaging";
import { Clearable } from "../../../util/types/clearable/clearable.interface";
import { RessourcesObservable } from "./ressources.observable";
import { SVGObservable } from "./svg/svg.observable";

export class ViewModel implements Clearable, Messageable {
    public readonly messages: MessagingObservable;
    public readonly svg: SVGObservable;
    public readonly ressources: RessourcesObservable;

    constructor(ko: Knockout) {
        this.messages = new MessagingObservable(ko);
        this.svg = new SVGObservable(ko, this.getMessagingHandler());
        this.ressources = new RessourcesObservable(ko);
    }

    public async init(): Promise<void> {
        await this.ressources.init();
        await this.svg.init();
    }

    public getMessagingHandler(): MessagingHandler {
        return new MessagingHandler(this.messages);
    }

    public clear(): void {
        this.getMessagingHandler().clearAll();
    }

}

export function createViewModel(ko: Knockout) {
    return new ViewModel(ko);
}