import { MatchLocationFieldEnum } from "../../../../client";
import { MatchSchema } from "../helper/match-schema.enum";
import { LocationFieldEnum } from "../helper/location-field.enum";
import { Knockout } from "../../../../util/knockout";
import { MatchAbstractObservable } from "./match-abstract.observable";
import { MessagedPredicates, parallelValidator, validable, ValidableObservable, Validator } from "../../../../util/validation";

export interface MatchLocationObservable extends MatchAbstractObservable {
    field: ValidableObservable<LocationFieldEnum>;
    match: ValidableObservable<string>;
    getField(): LocationFieldEnum | undefined;
    getMatch(): string | undefined;
    setField(location: LocationFieldEnum): void;
    setMatch(match: string): void;
}

export class MatchLocationObservableDefault extends MatchAbstractObservable implements MatchLocationObservable {

    public readonly field: ValidableObservable<MatchLocationFieldEnum>;
    public readonly match: ValidableObservable<string>;

    constructor(ko: Knockout) {
        super(ko, MatchSchema.MatchLocation);
        this.field = validable<MatchLocationFieldEnum>(ko, undefined, [
            MessagedPredicates.NOT_UNDEFINED('Field')
        ]);
        this.match = validable<string>(ko, undefined, [
            MessagedPredicates.NOT_UNDEFINED('Match')
        ]);
    }

    getValidator(): Validator {
        return parallelValidator([
            this.field.getValidator(),
            this.match.getValidator()
        ]);
    }

    setField(location: MatchLocationFieldEnum): void {
        this.field(location);
    }
    setMatch(match: string): void {
        this.match(match);
    }


    getField(): MatchLocationFieldEnum | undefined {
        return this.field();
    }
    getMatch(): string | undefined {
        return this.match();
    }
}

export function createMatchLocation(ko: Knockout): MatchLocationObservable {
    return new MatchLocationObservableDefault(ko);
}