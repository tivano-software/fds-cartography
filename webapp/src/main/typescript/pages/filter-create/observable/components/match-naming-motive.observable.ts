import { MatchNamingMotiveNamingMotiveEnum } from "../../../../client";
import { MatchSchema } from "../helper/match-schema.enum";
import { NamingMotiveEnum } from "../helper/layer.enum";
import { Knockout } from "../../../../util/knockout";
import { MatchAbstractObservable } from "./match-abstract.observable";
import { MessagedPredicates, sequentiellValidator, validable, ValidableObservable, Validator } from "../../../../util/validation/index";


export interface MatchNamingMotiveObservable extends MatchAbstractObservable {
    namingMotive: ValidableObservable<NamingMotiveEnum>;
    getNamingMotive(): NamingMotiveEnum | undefined;
    setNamingMotive(layer: NamingMotiveEnum): void;
}

export class MatchNamingMotiveObservableDefault extends MatchAbstractObservable implements MatchNamingMotiveObservable {

    public readonly namingMotive: ValidableObservable<MatchNamingMotiveNamingMotiveEnum>;

    constructor(ko: Knockout) {
        super(ko, MatchSchema.MatchNamingMotive);
        this.namingMotive = validable<NamingMotiveEnum>(ko, undefined, [
            MessagedPredicates.NOT_UNDEFINED('NamingMotive')
        ]);
    }

    getValidator(): Validator {
        return sequentiellValidator([
            this.namingMotive.getValidator()
        ]);
    }

    setNamingMotive(layer: NamingMotiveEnum): void {
        this.namingMotive(layer);
    }

    getNamingMotive(): NamingMotiveEnum | undefined {
        return this.namingMotive();
    }
}

export function createMatchNamingMotive(ko: Knockout): MatchNamingMotiveObservable {
    return new MatchNamingMotiveObservableDefault(ko);
}