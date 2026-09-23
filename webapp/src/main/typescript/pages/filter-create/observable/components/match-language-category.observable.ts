import { MatchLanguageCategoryLanguageCategoryEnum } from "../../../../client";
import { MatchSchema } from "../helper/match-schema.enum";
import { LanguageCategoryEnum } from "../helper/layer.enum";
import { Knockout } from "../../../../util/knockout";
import { MatchAbstractObservable } from "./match-abstract.observable";
import { MessagedPredicates, sequentiellValidator, validable, ValidableObservable, Validator } from "../../../../util/validation/index";


export interface MatchLanguageCategoryObservable extends MatchAbstractObservable {
    languageCategory: ValidableObservable<LanguageCategoryEnum>;
    getLanguageCategory(): LanguageCategoryEnum | undefined;
    setLanguageCategory(category: LanguageCategoryEnum): void;
}

export class MatchLanguageCategoryObservableDefault extends MatchAbstractObservable implements MatchLanguageCategoryObservable {

    public readonly languageCategory: ValidableObservable<MatchLanguageCategoryLanguageCategoryEnum>;

    constructor(ko: Knockout) {
        super(ko, MatchSchema.MatchLanguageCategory);
        this.languageCategory = validable<LanguageCategoryEnum>(ko, undefined, [
            MessagedPredicates.NOT_UNDEFINED('LanguageCategory')
        ]);
    }

    getValidator(): Validator {
        return sequentiellValidator([
            this.languageCategory.getValidator()
        ]);
    }

    setLanguageCategory(category: LanguageCategoryEnum): void {
        this.languageCategory(category);
    }

    getLanguageCategory(): LanguageCategoryEnum | undefined {
        return this.languageCategory();
    }
}

export function createMatchLanguageCategory(ko: Knockout): MatchLanguageCategoryObservable {
    return new MatchLanguageCategoryObservableDefault(ko);
}