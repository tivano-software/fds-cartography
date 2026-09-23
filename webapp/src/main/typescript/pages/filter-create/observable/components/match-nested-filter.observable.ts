import { MatchSchema } from "../helper/match-schema.enum";
import { Knockout, Observable } from "../../../../util/knockout";
import { MatchAbstractObservable } from "./match-abstract.observable";
import { createMatchAllOf, createMatchAnyOf, MatchChildsObservable } from "./match-childs.observable";
import { createMatchLayer, MatchLayerObservable } from "./match-layer.observable";
import { createMatchNamingMotive, MatchNamingMotiveObservable } from "./match-naming-motive.observable";
import { createMatchLanguageCategory, MatchLanguageCategoryObservable } from "./match-language-category.observable";
import { createMatchLocation, MatchLocationObservable } from "./match-location.observable";
import { createMatchTypesRegex, MatchTypesRegexObservable } from "./match-types-regex.observable";
import { createMatchTypesDescriptionRegex, MatchTypesDescriptionRegexObservable } from "./match-types-description.observable";
import { MatchRemovable } from "../helper/match-removable.interface";
import { MessagedPredicates, sequentiellValidator, validable, ValidableObservable, Validator } from "../../../../util/validation";


export interface MatchNestedFilterObservable extends MatchAbstractObservable, MatchRemovable {
    filter: Observable<MatchAbstractObservable>;
    getFilter(): MatchAbstractObservable | undefined;
    setFilter(observable: MatchAbstractObservable): void;
    setFilterToMatchRegex(regex: string): MatchTypesRegexObservable;
    setFilterToMatchTypesDescriptionRegex(regex: string): MatchTypesDescriptionRegexObservable;
    setFilterToMatchAll(): MatchChildsObservable;
    setFilterToMatchAny(): MatchChildsObservable;
    setFilterToMatchLocation(): MatchLocationObservable;
    setFilterToMatchLayer(): MatchLayerObservable;
    setFilterToMatchNamingMotive(): MatchNamingMotiveObservable;
    setFilterToMatchLanguageCategory(): MatchLanguageCategoryObservable;
    setFilterToMatchNot(): MatchNestedFilterObservable;
    setFilterToMatchSameLocationAs(): MatchNestedFilterObservable;
    setFilterToMatchSameTypeAs(): MatchNestedFilterObservable;
}

export class MatchNestedFilterObservableDefault extends MatchAbstractObservable implements MatchNestedFilterObservable {

    public readonly filter: ValidableObservable<MatchAbstractObservable>;

    constructor(ko: Knockout, schema : MatchSchema) {
        super(ko, schema);
        this.filter = validable<MatchAbstractObservable>(ko, undefined, [
            MessagedPredicates.NOT_UNDEFINED('Enthaltener Filter'),
        ]);
    }

    getValidator(): Validator {
        return sequentiellValidator([
            this.filter.getValidator(),
            this.filter()?.getValidator()
        ]);
    }

    remove(observable: MatchAbstractObservable): void {
        if(observable === this.filter()) {
            this.filter(undefined);
        }
    }

    setFilter(observable: MatchAbstractObservable): void {
        this.filter(observable);
    }

    setFilterToMatchRegex(regex: string): MatchTypesRegexObservable {
        const newFilter = createMatchTypesRegex(this.ko);
        newFilter.regexp(regex);
        this.filter(newFilter);
        return newFilter;
    }

    setFilterToMatchTypesDescriptionRegex(regex: string): MatchTypesDescriptionRegexObservable {
        const newFilter = createMatchTypesDescriptionRegex(this.ko);
        newFilter.regexp(regex);
        this.filter(newFilter);
        return newFilter;
    }

    setFilterToMatchAll(): MatchChildsObservable {
        const newFilter = createMatchAllOf(this.ko);
        this.filter(newFilter);
        return newFilter;
    }

    setFilterToMatchAny(): MatchChildsObservable {
        const newFilter = createMatchAnyOf(this.ko);
        this.filter(newFilter);
        return newFilter;
    }

    setFilterToMatchLocation(): MatchLocationObservable {
        const newFilter = createMatchLocation(this.ko);
        this.filter(newFilter);
        return newFilter;
    }

    setFilterToMatchLayer(): MatchLayerObservable {
        const newFilter = createMatchLayer(this.ko);
        this.filter(newFilter);
        return newFilter;
    }

    setFilterToMatchNamingMotive(): MatchNamingMotiveObservable {
        const newFilter = createMatchNamingMotive(this.ko);
        this.filter(newFilter);
        return newFilter;
    }

    setFilterToMatchLanguageCategory(): MatchLanguageCategoryObservable {
        const newFilter = createMatchLanguageCategory(this.ko);
        this.filter(newFilter);
        return newFilter;
    }

    setFilterToMatchNot(): MatchNestedFilterObservable {
        const newFilter = createNestedFilter(this.ko, MatchSchema.MatchNot);
        this.filter(newFilter);
        return newFilter;
    }

    setFilterToMatchSameLocationAs(): MatchNestedFilterObservable {
        const newFilter = createNestedFilter(this.ko, MatchSchema.MatchSameLocationAs);
        this.filter(newFilter);
        return newFilter;
    }

    setFilterToMatchSameTypeAs(): MatchNestedFilterObservable {
        const newFilter = createNestedFilter(this.ko, MatchSchema.MatchSameTypeAs);
        this.filter(newFilter);
        return newFilter;
    }
    getFilter(): MatchAbstractObservable | undefined {
        return this.filter();
    }

}

export function createNestedFilter(ko: Knockout, schema : MatchSchema): MatchNestedFilterObservable {
    return new MatchNestedFilterObservableDefault(ko, schema);
}