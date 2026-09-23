import { MatchAbstractObservable } from "../components/match-abstract.observable";


export interface MatchRemovable {
    remove(observable: MatchAbstractObservable): void;
}