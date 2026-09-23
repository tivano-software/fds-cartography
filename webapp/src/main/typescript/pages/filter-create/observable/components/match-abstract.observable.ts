
import { Computed, Knockout } from "../../../../util/knockout";
import { Validable, Validator } from "../../../../util/validation";
import { MatchSchema, filterSchemaEnumToString } from "../helper/match-schema.enum";
import { MatchSchemaable } from "../helper/match-schemaable.interface";

export abstract class MatchAbstractObservable implements Validable, MatchSchemaable {
    public readonly schema: MatchSchema;
    public readonly schemaHumanReadable: Computed<string>;
    public readonly ko: Knockout;

    constructor(ko: Knockout, schema: MatchSchema) {
        this.ko = ko;
        this.schema = schema;
        this.schemaHumanReadable = ko.computed(() => filterSchemaEnumToString(this.schema));
    }

    public abstract getValidator(): Validator;

    public getMatchSchema(): MatchSchema {
        return this.schema;
    }
}