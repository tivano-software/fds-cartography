import { Knockout, Observable } from "../../../../../util/knockout";
import { MatchNestedFilterObservable } from "../../components/match-nested-filter.observable";
import { MatchAbstractEditorObservable, MatchAbstractEditorObservableDefault } from "./match-abstract-editor.observable";
import { MatchRemovable } from "../../helper/match-removable.interface";
import { MatchSchema } from "../../helper/match-schema.enum";



export interface MatchNestedFilterEditorObservable extends MatchAbstractEditorObservable {

}

export class MatchNestedFilterEditorObservableDefault extends MatchAbstractEditorObservableDefault implements MatchNestedFilterEditorObservable {

    private nestedFilterObservable: MatchNestedFilterObservable;

    constructor(
        ko: Knockout,
        parent: MatchRemovable | undefined,
        filter: MatchNestedFilterObservable,
        styleColPrefix: Observable<string>,
        styleColContent: Observable<string>,
    ) {
        super(
            ko,
            parent,
            filter,
            styleColPrefix,
            styleColContent,
        );
        this.nestedFilterObservable = filter;
    }

    createMatchAny(): void {
        this.nestedFilterObservable.setFilterToMatchAny();
    }

    createMatchAll(): void {
        this.nestedFilterObservable.setFilterToMatchAll();
    }

    createMatchNot(): void {
        // If the outer filter already is a "MatchNot" and we want to create
        // another nested "MatchNot" as the embedded filter, simply remove both
        // filters because two "not" operations cancel each other out.
        if (this.getFilterSchema() == MatchSchema.MatchNot) {
            this.parent?.remove(this.filter);
        } else {
            this.nestedFilterObservable.setFilterToMatchNot();
        }
    }

    createMatchSameLocationAs(): void {
        // Only add the filter if the filter is not already a
        // "MatchSameLocationAs".
        // Directly nesting "MakeSameLocationAs" does not make sense
        if (this.getFilterSchema() != MatchSchema.MatchSameLocationAs) {
            this.nestedFilterObservable.setFilterToMatchSameLocationAs();
        }
    }

    createMatchSameTypeAs(): void {
        // Only add the filter if the filter is not already a
        // "MatchSameTypeAs".
        // Directly nesting "MatchSameTypeAs" does not make sense
        if (this.getFilterSchema() != MatchSchema.MatchSameTypeAs) {
            this.nestedFilterObservable.setFilterToMatchSameTypeAs();
        }
    }

    createMatchRegex(): void {
        this.nestedFilterObservable.setFilterToMatchRegex("");
    }

    createMatchLocation(): void {
        this.nestedFilterObservable.setFilterToMatchLocation();
    }

    createMatchLayer(): void {
        this.nestedFilterObservable.setFilterToMatchLayer();
    }

    createMatchLanguageCategory(): void {
        this.nestedFilterObservable.setFilterToMatchLanguageCategory();
    }
    createMatchNamingMotive(): void {
        this.nestedFilterObservable.setFilterToMatchNamingMotive();
    }
}

export function createMatchEmptyEditor(
    ko: Knockout,
    parent: MatchRemovable | undefined,
    filter: MatchNestedFilterObservable,
    styleColPrefix: Observable<string>,
    styleColContent: Observable<string>,
): MatchAbstractEditorObservable {
    return new MatchNestedFilterEditorObservableDefault(
        ko,
        parent,
        filter,
        styleColPrefix,
        styleColContent,
    );
}