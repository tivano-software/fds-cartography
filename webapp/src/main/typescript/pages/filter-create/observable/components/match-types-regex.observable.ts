import { Knockout, Observable } from "../../../../util/knockout";
import { MessagedPredicates, validable, ValidableObservable, Validator } from "../../../../util/validation";
import { MatchSchema } from "../helper/match-schema.enum";
import { MatchAbstractObservable } from "./match-abstract.observable";


export interface MatchTypesRegexObservable extends MatchAbstractObservable {
    regexp: ValidableObservable<string>;
    getRegex(): string | undefined;
    setRegex(regex: string): void;
}

class MatchTypesRegexObservableDefault extends MatchAbstractObservable implements MatchTypesRegexObservable {

    public readonly regexp: ValidableObservable<string>;

    constructor(ko: Knockout, regexp: string) {
        super(ko, MatchSchema.MatchTypesRegex);
        this.regexp = validable(ko, regexp, [
            MessagedPredicates.NOT_UNDEFINED("Regex"),
            MessagedPredicates.NOT_EMPTY_STRING("Regex")
        ]);
    }

    getValidator(): Validator {
        return this.regexp.getValidator();
    }

    setRegex(regex: string): void {
        this.regexp(regex);
    }

    getRegex(): string | undefined {
        return this.regexp();
    }

    clear(): void {
        this.regexp(undefined);
    }
}

export function createMatchTypesRegex(ko: Knockout): MatchTypesRegexObservable {
    return new MatchTypesRegexObservableDefault(ko, "");
}
