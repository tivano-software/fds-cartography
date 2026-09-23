import { cleanHtmlTags } from "../../../../util/clean-input/clean-html-tag";
import { Knockout, ObservableNotNull, WriteComputed } from "../../../../util/knockout/lib/knockout.interface";
import { mapObservable } from "../../../../util/knockout/mapObservable";
import { Color } from "../../../../util/types/color/color.type";

// TODO refactor: rename to FilterDataSettings
export class FilterData {
    readonly id: ObservableNotNull<number>;
    readonly name: WriteComputed<string>;
    readonly colorPieChart: ObservableNotNull<Color>;
    readonly openColorPickerPieChart: ObservableNotNull<boolean>;
    readonly colorAreaColoring: ObservableNotNull<Color>;
    readonly openColorPickerAreaColoring: ObservableNotNull<boolean>;
    readonly customName: ObservableNotNull<string>;
    readonly considerWhileCreatingAreaColoring: ObservableNotNull<boolean>;
    readonly considerWhileCreatingPiechart: ObservableNotNull<boolean>;

    public constructor(ko: Knockout, data: {
        name: string,
        id: number,
        colorAreaColoring: Color,
        colorPieChart: Color,
        customName: string,
        areaColoringActive: boolean,
        pieChartActive: boolean,
    }) {
        this.name = mapObservable(ko, data.name, this, {
            read: (val) => {
                return cleanHtmlTags(val);
            }
        });
        this.id = ko.observable(data.id);
        this.colorAreaColoring = ko.observable(data.colorAreaColoring);
        this.openColorPickerAreaColoring = ko.observable(false);
        this.colorPieChart = ko.observable(data.colorPieChart);
        this.openColorPickerPieChart = ko.observable(false);
        this.customName = ko.observable(data.customName);
        this.considerWhileCreatingAreaColoring = ko.observable(data.areaColoringActive);
        this.considerWhileCreatingPiechart = ko.observable(data.pieChartActive);
    }
};