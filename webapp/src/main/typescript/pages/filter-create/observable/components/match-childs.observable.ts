import { Computed, Knockout, ObservableArray } from "../../../../util/knockout";
import { ChildableObservable } from "../helper/childable.observable";
import { MatchSchema } from "../helper/match-schema.enum";
import { MatchAbstractObservable } from "./match-abstract.observable";
import { createMatchTypesRegex, MatchTypesRegexObservable } from "./match-types-regex.observable";
import { createMatchTypesDescriptionRegex, MatchTypesDescriptionRegexObservable } from "./match-types-description.observable";
import { createMatchLayer, MatchLayerObservable } from "./match-layer.observable";
import { createMatchNamingMotive, MatchNamingMotiveObservable } from "./match-naming-motive.observable";
import { createMatchLanguageCategory, MatchLanguageCategoryObservable } from "./match-language-category.observable";
import { createMatchLocation, MatchLocationObservable } from "./match-location.observable";
import { createNestedFilter, MatchNestedFilterObservable } from "./match-nested-filter.observable";
import { parallelValidator, Validator } from "../../../../util/validation";


export interface MatchChildsObservable extends MatchAbstractObservable, ChildableObservable<MatchAbstractObservable> {
    addMatchRegex(regex: string): MatchTypesRegexObservable;
    addMatchTypesDescriptionRegex(regex: string): MatchTypesDescriptionRegexObservable;
    addMatchAll(): MatchChildsObservable;
    addMatchAny(): MatchChildsObservable;
    addMatchLocation(): MatchLocationObservable;
    addMatchLayer(): MatchLayerObservable;
    addMatchLanguageCategory(): MatchLanguageCategoryObservable;
    addMatchNamingMotive(): MatchNamingMotiveObservable;
    addMatchNot(): MatchNestedFilterObservable;
    addMatchSameLocationAs(): MatchNestedFilterObservable;
    addMatchSameTypeAs(): MatchNestedFilterObservable;
    remove(value: MatchAbstractObservable): void;
    getMatchables(): MatchAbstractObservable[];
}

class MatchChildsObservableDefault extends MatchAbstractObservable implements MatchChildsObservable {

    public readonly childs: ObservableArray<MatchAbstractObservable>;

    constructor(ko: Knockout, schema: MatchSchema.MatchAll | MatchSchema.MatchAny) {
        super(ko, schema);
        this.childs = ko.observableArray<MatchAbstractObservable>([]);
    }

    getValidator(): Validator {
        const validatorList = this.childs().map(child => child.getValidator());
        return parallelValidator(validatorList);
    }

    getMatchables(): MatchAbstractObservable[] {
        return this.getChilds();
    }

    addMatchLocation(): MatchLocationObservable {
        const newFilter = createMatchLocation(this.ko);
        this.childs.push(newFilter);
        return newFilter;
    }

    addMatchLayer(): MatchLayerObservable {
        const newFilter = createMatchLayer(this.ko);
        this.childs.push(newFilter);
        return newFilter;
    }

    addMatchLanguageCategory(): MatchLanguageCategoryObservable {
        const newFilter = createMatchLanguageCategory(this.ko);
        this.childs.push(newFilter);
        return newFilter;
    }

    addMatchNamingMotive(): MatchNamingMotiveObservable {
        const newFilter = createMatchNamingMotive(this.ko);
        this.childs.push(newFilter);
        return newFilter;
    }

    addMatchNot(): MatchNestedFilterObservable {
        const newFilter = createNestedFilter(this.ko, MatchSchema.MatchNot);
        this.childs.push(newFilter);
        return newFilter;
    }

    addMatchSameLocationAs(): MatchNestedFilterObservable {
        const newFilter = createNestedFilter(this.ko, MatchSchema.MatchSameLocationAs);
        this.childs.push(newFilter);
        return newFilter;
    }

    addMatchSameTypeAs(): MatchNestedFilterObservable {
        const newFilter = createNestedFilter(this.ko, MatchSchema.MatchSameTypeAs);
        this.childs.push(newFilter);
        return newFilter;
    }

    add(child: MatchAbstractObservable): void {
        this.childs.push(child);
    }

    getChilds(): MatchAbstractObservable[] {
        return this.childs();
    }

    remove(value: MatchAbstractObservable): void {
        this.childs.remove(value);
    }

    addMatchRegex(regex: string): MatchTypesRegexObservable {
        const newFilter = createMatchTypesRegex(this.ko);
        newFilter.regexp(regex);
        this.childs.push(newFilter);
        return newFilter;
    }

    addMatchTypesDescriptionRegex(regex: string): MatchTypesDescriptionRegexObservable {
        const newFilter = createMatchTypesDescriptionRegex(this.ko);
        newFilter.regexp(regex);
        this.childs.push(newFilter);
        return newFilter;
    }

    addMatchAll(): MatchChildsObservable {
        const newFilter = createMatchAllOf(this.ko);
        this.childs.push(newFilter);
        return newFilter;
    }

    addMatchAny(): MatchChildsObservable {
        const newFilter = createMatchAnyOf(this.ko);
        this.childs.push(newFilter);
        return newFilter;
    }

}

export function createMatchAllOf(ko: Knockout): MatchChildsObservable {
    return new MatchChildsObservableDefault(ko, MatchSchema.MatchAll);
}

export function createMatchAnyOf(ko: Knockout): MatchChildsObservable {
    return new MatchChildsObservableDefault(ko, MatchSchema.MatchAny);
}