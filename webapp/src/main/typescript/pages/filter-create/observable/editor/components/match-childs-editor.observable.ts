import { Knockout, Observable } from "../../../../../util/knockout";
import { MatchChildsObservable } from "../../components/match-childs.observable";
import { MatchAbstractObservable } from "../../components/match-abstract.observable";
import { MatchAbstractEditorObservable, MatchAbstractEditorObservableDefault } from "./match-abstract-editor.observable";
import { MatchRemovable } from "../../helper/match-removable.interface";

export interface MatchChildsEditorObservable extends MatchAbstractEditorObservable, MatchRemovable {
    createMatchAny(): void;
    createMatchAll(): void;
    createMatchNot(): void;
    createMatchSameLocationAs(): void;
    createMatchSameTypeAs(): void;
    createMatchRegex(): void;
    createMatchTypesDescriptionRegex(): void;
    createMatchLocation(): void;
    createMatchLayer(): void;
    createMatchNamingMotive(): void;
    createMatchLanguageCategory(): void;
}

class MatchChildsEditorObservableDefault extends MatchAbstractEditorObservableDefault implements MatchChildsEditorObservable {


    private matchChilds: MatchChildsObservable;

    constructor(
        ko: Knockout,
        parent: MatchRemovable | undefined,
        filter: MatchChildsObservable,
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
        this.matchChilds = filter;
    }

    remove(observable: MatchAbstractObservable): void {
        this.matchChilds.remove(observable);
    }

    createMatchNot(): void {
        this.matchChilds.addMatchNot();
    }

    createMatchSameLocationAs(): void {
        this.matchChilds.addMatchSameLocationAs();
    }

    createMatchSameTypeAs(): void {
        this.matchChilds.addMatchSameTypeAs();
    }

    createMatchLocation(): void {
        this.matchChilds.addMatchLocation();
    }

    createMatchLayer(): void {
        this.matchChilds.addMatchLayer();
    }

    createMatchNamingMotive(): void {
        this.matchChilds.addMatchNamingMotive();
    }

    createMatchLanguageCategory(): void {
        this.matchChilds.addMatchLanguageCategory();
    }

    createMatchAny(): void {
        this.matchChilds.addMatchAny();
    }

    createMatchAll(): void {
        this.matchChilds.addMatchAll();
    }

    createMatchRegex(): void {
        this.matchChilds.addMatchRegex("");
    }

    createMatchTypesDescriptionRegex(): void {
        this.matchChilds.addMatchTypesDescriptionRegex("");
    }

}

export function createMatchChildsFilterEditor(
    ko: Knockout,
    parent: MatchRemovable | undefined,
    filter: MatchChildsObservable,
    styleColPrefix: Observable<string>,
    styleColContent: Observable<string>,
) {
    return new MatchChildsEditorObservableDefault(
        ko,
        parent,
        filter,
        styleColPrefix,
        styleColContent
    );
}