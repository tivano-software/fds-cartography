import { Knockout } from "../../../util/knockout"
import { ObservableNotNull } from "../../../util/knockout/lib/knockout.interface";

export class ClusterEditObservable {

    public readonly brush: {
        radius: ObservableNotNull<number>;
        visible: ObservableNotNull<boolean>,
        x: ObservableNotNull<number>,
        y: ObservableNotNull<number>,
    }

    public constructor(ko: Knockout) {
        this.brush = {
            radius: ko.observable(20),
            visible: ko.observable(false),
            x: ko.observable(0),
            y: ko.observable(0)
        };
    }
}