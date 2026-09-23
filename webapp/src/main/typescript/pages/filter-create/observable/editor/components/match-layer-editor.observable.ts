import { Knockout, Observable } from "../../../../../util/knockout";
import { MatchAbstractObservable } from "../../components/match-abstract.observable";
import { MatchAbstractEditorObservable, MatchAbstractEditorObservableDefault } from "./match-abstract-editor.observable";
import { MatchRemovable } from "../../helper/match-removable.interface";


export interface MatchLayerEditorObservable extends MatchAbstractEditorObservable {

}

export class MatchLayerEditorObservableDefault extends MatchAbstractEditorObservableDefault implements MatchLayerEditorObservable {

    constructor(
        ko: Knockout,
        parent: MatchRemovable | undefined,
        filter: MatchAbstractObservable,
        styleColPrefix: Observable<string>,
        styleColContent: Observable<string>,
    ) {
        super(
            ko,
            parent,
            filter,
            styleColPrefix,
            styleColContent
        );
    }

}