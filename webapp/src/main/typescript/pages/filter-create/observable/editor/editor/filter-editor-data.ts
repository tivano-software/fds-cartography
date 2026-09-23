import { Computed, Knockout, Observable } from "../../../../../util/knockout";
import { ObservableNotNull } from "../../../../../util/knockout/lib/knockout.interface";
import { MessagedPredicates, parallelValidator, validable, ValidableObservable, Validator } from "../../../../../util/validation";
import { MatchAbstractObservable } from "../../components/match-abstract.observable";
import { createMatchAllOf, createMatchAnyOf, MatchChildsObservable } from "../../components/match-childs.observable";
import { createMatchLayer, MatchLayerObservable } from "../../components/match-layer.observable";
import { createMatchNamingMotive, MatchNamingMotiveObservable } from "../../components/match-naming-motive.observable";
import { createMatchLanguageCategory, MatchLanguageCategoryObservable } from "../../components/match-language-category.observable";
import { createMatchLocation, MatchLocationObservable } from "../../components/match-location.observable";
import { createNestedFilter, MatchNestedFilterObservable } from "../../components/match-nested-filter.observable";
import { createMatchTypesRegex, MatchTypesRegexObservable } from "../../components/match-types-regex.observable";
import { createMatchTypesDescriptionRegex, MatchTypesDescriptionRegexObservable } from "../../components/match-types-description.observable";
import { MatchSchema } from "../../helper/match-schema.enum";



export class FilterEditorData {
    public readonly name: ValidableObservable<string>;
    public readonly filter: Observable<MatchAbstractObservable>;
    public readonly id: Observable<number>;
    public readonly description: Observable<string>;
    public readonly isNew: Computed<boolean>;
    public readonly editable: ObservableNotNull<boolean>;
    public readonly editableAfterLoading: ObservableNotNull<boolean>;

    constructor(private ko: Knockout) {
        this.editable = ko.observable<boolean>(false);
        this.editableAfterLoading = ko.observable<boolean>(false);
        this.id = ko.observable<number>(undefined);
        this.description = ko.observable(undefined);
        this.name = validable(ko, undefined, [
            MessagedPredicates.NOT_EMPTY_STRING('Name')
        ]);
        this.filter = ko.observable<MatchAbstractObservable>(undefined);
        this.isNew = this.ko.computed<boolean>(() => {
            return this.isIdGiven();
        });
    }

    public getValidator(): Validator {
        return parallelValidator([
            this.filter()?.getValidator(),
            this.name.getValidator()
        ]);
    }

    public isIdGiven(): boolean {
        return this.id() === undefined;
    }

    public setFilterToRegex(): MatchTypesRegexObservable {
        const reg = createMatchTypesRegex(this.ko);
        this.filter(reg);
        return reg;
    }

    public setFilterToTypesDescriptionRegex(): MatchTypesDescriptionRegexObservable {
        const reg = createMatchTypesDescriptionRegex(this.ko);
        this.filter(reg);
        return reg;
    }

    public setFilterToMatchAll(): MatchChildsObservable {
        const allOf = createMatchAllOf(this.ko);
        this.filter(allOf);
        return allOf;
    }

    public setFilterToMatchAny(): MatchChildsObservable {
        const anyOf = createMatchAnyOf(this.ko);
        this.filter(anyOf);
        return anyOf;
    }

    public setFilterToMatchNot(): MatchNestedFilterObservable {
        const not = createNestedFilter(this.ko, MatchSchema.MatchNot);
        this.filter(not);
        return not;
    }

    public setFilterToMatchSameLocationAs(): MatchNestedFilterObservable {
        const not = createNestedFilter(this.ko, MatchSchema.MatchSameLocationAs);
        this.filter(not);
        return not;
    }

    public setFilterToMatchSameTypeAs(): MatchNestedFilterObservable {
        const not = createNestedFilter(this.ko, MatchSchema.MatchSameTypeAs);
        this.filter(not);
        return not;
    }

    public setFilterToLocation(): MatchLocationObservable {
        const location = createMatchLocation(this.ko);
        this.filter(location);
        return location;
    }

    public setFilterToLayer(): MatchLayerObservable {
        const layer = createMatchLayer(this.ko);
        this.filter(layer);
        return layer;
    }

    public setFilterToNamingMotive(): MatchNamingMotiveObservable {
        const layer = createMatchNamingMotive(this.ko);
        this.filter(layer);
        return layer;
    }

    public setFilterToLanguageCategory(): MatchLanguageCategoryObservable {
        const layer = createMatchLanguageCategory(this.ko);
        this.filter(layer);
        return layer;
    }

    public setFilterToUndefined(): void {
        this.filter(undefined);
    }

    public getFilter(): MatchAbstractObservable | undefined {
        if (this.filter() === undefined) {
            return undefined;
        }
        return this.filter();
    }
}