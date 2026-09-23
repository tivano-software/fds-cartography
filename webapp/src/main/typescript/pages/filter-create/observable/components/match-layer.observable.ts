import { MatchLayerLayerEnum } from "../../../../client";
import { MatchSchema } from "../helper/match-schema.enum";
import { LayerEnum } from "../helper/layer.enum";
import { Knockout } from "../../../../util/knockout";
import { MatchAbstractObservable } from "./match-abstract.observable";
import { MessagedPredicates, sequentiellValidator, validable, ValidableObservable, Validator } from "../../../../util/validation/index";


export interface MatchLayerObservable extends MatchAbstractObservable {
    layer: ValidableObservable<LayerEnum>;
    getLayer(): LayerEnum | undefined;
    setLayer(layer: LayerEnum): void;
}

export class MatchLayerObservableDefault extends MatchAbstractObservable implements MatchLayerObservable {

    public readonly layer: ValidableObservable<MatchLayerLayerEnum>;

    constructor(ko: Knockout) {
        super(ko, MatchSchema.MatchLayer);
        this.layer = validable<MatchLayerLayerEnum>(ko, undefined, [
            MessagedPredicates.NOT_UNDEFINED('Layer')
        ]);
    }

    getValidator(): Validator {
        return sequentiellValidator([
            this.layer.getValidator()
        ]);
    }

    setLayer(layer: MatchLayerLayerEnum): void {
        this.layer(layer);
    }

    getLayer(): MatchLayerLayerEnum | undefined {
        return this.layer();
    }
}

export function createMatchLayer(ko: Knockout): MatchLayerObservable {
    return new MatchLayerObservableDefault(ko);
}