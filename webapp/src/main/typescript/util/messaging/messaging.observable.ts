import { Computed, Knockout, Observable, ObservableArray } from "../knockout";
import { XML } from "../services/xml-tag-service";
import { XMLString } from "../services/xml-tag-service/helper-types/xml-string";
import { Validable } from "../validation";
import { createHtml, MessagingNavbarObject, MessagingNavbarTypes } from "./messaging-navbar.types";



export class MessagingObservable {
    readonly errorList: Computed<string[]>;
    readonly succesList: Computed<string[]>;
    readonly infoList: Computed<string[]>;
    readonly navbarMessages: Computed<XMLString<'span'>[]>;
    readonly validable: Observable<Validable>;
    readonly successListContainer: ObservableArray<string>;
    readonly infoListContainer: ObservableArray<string>;
    readonly errorListContainer: ObservableArray<string>;
    readonly navbarMessagesContainer: ObservableArray<MessagingNavbarObject>

    constructor(ko: Knockout) {
        this.successListContainer = ko.observableArray<string>([]);
        this.infoListContainer = ko.observableArray<string>([]);
        this.errorListContainer = ko.observableArray<string>([]);
        this.navbarMessagesContainer = ko.observableArray<MessagingNavbarObject>([]);
        this.validable = ko.observable<Validable>(undefined);
        this.errorList = ko.computed<string[]>(() => {
            if(this.validable() !== undefined) {
                const errors: string[] = [];
                this.errorListContainer().forEach(error => errors.push(error));
                this.validable()?.getValidator().error().forEach(error => errors.push(error));
                return errors;
            }
            return this.errorListContainer();
        });
        this.succesList = ko.computed<string[]>(() => {
            return this.successListContainer();
        });
        this.infoList = ko.computed<string[]>(() => {
            return this.infoListContainer();
        });
        this.navbarMessages = ko.computed<XMLString<'span'>[]>(() => {
            return this.navbarMessagesContainer().map(val => createHtml(val));
        });
    }
}