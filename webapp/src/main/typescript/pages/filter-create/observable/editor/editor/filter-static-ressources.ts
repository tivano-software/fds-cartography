import { MatchLanguageCategoryLanguageCategoryEnum, MatchLayerLayerEnum, MatchLocationFieldEnum, MatchNamingMotiveNamingMotiveEnum } from "../../../../../client";
import { Knockout, ObservableArray } from "../../../../../util/knockout/lib/knockout.interface";

export class FilterEditorStaticRessources {
    public readonly layerList: ObservableArray<MatchLayerLayerEnum>;
    public readonly namingMotiveList: ObservableArray<MatchNamingMotiveNamingMotiveEnum>;
    public readonly languageCategoryList: ObservableArray<MatchLanguageCategoryLanguageCategoryEnum>;
    public readonly locationFieldList: ObservableArray<MatchLocationFieldEnum>;

    constructor(ko: Knockout) {
        this.layerList = ko.observableArray<MatchLayerLayerEnum>([]);
        this.namingMotiveList = ko.observableArray<MatchNamingMotiveNamingMotiveEnum>([]);
        this.languageCategoryList = ko.observableArray<MatchLanguageCategoryLanguageCategoryEnum>([]);
        this.locationFieldList = ko.observableArray<MatchLocationFieldEnum>([]);
    }

    init(): void {
        Object.keys(MatchLayerLayerEnum).forEach(val => {
            this.addLayerElement(val as MatchLayerLayerEnum);
        });
        Object.keys(MatchLocationFieldEnum).forEach(val => {
            this.addLocationField(val as MatchLocationFieldEnum);
        });
        Object.keys(MatchNamingMotiveNamingMotiveEnum).forEach(val => {
            this.addNamingMotive(val as MatchNamingMotiveNamingMotiveEnum);
        });
        Object.keys(MatchLanguageCategoryLanguageCategoryEnum).forEach(val => {
            this.addLanguageCategory(val as MatchLanguageCategoryLanguageCategoryEnum);
        });
    }

    addLayerElement(value: MatchLayerLayerEnum): void {
        this.layerList.push(value);
    }

    addNamingMotive(value: MatchNamingMotiveNamingMotiveEnum): void {
        this.namingMotiveList.push(value);
    }

    addLanguageCategory(value: MatchLanguageCategoryLanguageCategoryEnum): void {
        this.languageCategoryList.push(value);
    }

    addLocationField(value: MatchLocationFieldEnum): void {
        this.locationFieldList.push(value);
    }
}