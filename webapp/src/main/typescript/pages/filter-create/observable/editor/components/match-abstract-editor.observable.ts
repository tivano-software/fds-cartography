import { filterSchemaEnumToString, MatchSchema } from "../../helper/match-schema.enum";
import { Computed, Knockout, Observable } from "../../../../../util/knockout/lib/knockout.interface";
import { MatchChildsObservable } from "../../components/match-childs.observable";
import { MatchAbstractObservable } from "../../components/match-abstract.observable";
import { MatchRemovable } from "../../helper/match-removable.interface";


export interface MatchAbstractEditorObservable {
    filter: MatchAbstractObservable;
    styleColPrefix: Observable<string>;
    styleColContent: Observable<string>;
    humanReadable: Computed<string>;
    delete(): void;
    isRoot(): boolean;
    isChildable(): boolean;
    getFilterSchema(): MatchSchema;
}

export abstract class MatchAbstractEditorObservableDefault implements MatchAbstractEditorObservable {
    readonly filter: MatchAbstractObservable;
    readonly styleColPrefix: Observable<string>;
    readonly styleColContent: Observable<string>;
    readonly humanReadable: Computed<string>;

    constructor(
        ko: Knockout,
        public readonly parent: MatchRemovable | undefined,
        filter: MatchAbstractObservable,
        styleColPrefix: Observable<string>,
        styleColContent: Observable<string>,
    ) {
        this.filter = filter;
        this.styleColContent = styleColContent;
        this.styleColPrefix = styleColPrefix;
        this.humanReadable = ko.computed(() => {
            return filter.schemaHumanReadable()
        });
    }

    isChildable(): boolean {
        return [MatchSchema.MatchAll, MatchSchema.MatchAny, MatchSchema.MatchNot, MatchSchema.MatchSameLocationAs, MatchSchema.MatchSameTypeAs].indexOf(this.getFilterSchema()) >= 0;
    }

    getFilterSchema(): MatchSchema {
        return this.filter.getMatchSchema();
    }

    delete(): void {
        if (this.parent !== undefined) {
            this.parent.remove(this.filter);
        }
    }

    isRoot(): boolean {
        return this.parent === undefined;
    }

}