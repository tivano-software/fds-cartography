import { Knockout, ObservableNotNull, Subscribable } from "../../../../util/knockout/lib/knockout.interface";

export class Range {
    private readonly minValue: ObservableNotNull<number>;
    private readonly maxValue: ObservableNotNull<number>;
    private readonly minValueEditable: ObservableNotNull<number>;
    private readonly maxValueEditable: ObservableNotNull<number>;
    private readonly range: {
        readonly min: ObservableNotNull<number>;
        readonly max: ObservableNotNull<number>;
    };
    private readonly rangeEditable: {
        readonly min: ObservableNotNull<number>;
        readonly max: ObservableNotNull<number>;
        readonly step: ObservableNotNull<number>;
    };

    constructor(ko: Knockout, vals: {
        min: number,
        max: number
    }, options: {
        range: {
            min: number,
            max: number
        },
        rangeEditable: {
            min: number,
            max: number,
            step: number,
        }
    }) {
        this.minValue = ko.observable(vals.min);
        this.maxValue = ko.observable(vals.max);
        this.range = {
            min: ko.observable(options.range.min),
            max: ko.observable(options.range.max)
        }
        this.rangeEditable = {
            min: ko.observable(options.rangeEditable.min),
            max: ko.observable(options.rangeEditable.max),
            step: ko.observable(options.rangeEditable.step)
        }
        this.minValueEditable = ko.observable(this.transformToEditable(vals.min));
        this.maxValueEditable = ko.observable(this.transformToEditable(vals.max));
        this.minValueEditable.subscribe(v => this.minValue(this.transformFromEditable(v)));
        this.maxValueEditable.subscribe(v => this.maxValue(this.transformFromEditable(v)));
    }

    private transformToEditable = (v: number) => Math.round(
        (this.rangeEditable.max() - this.rangeEditable.min()) * (v / (this.range.max() - this.range.min())) * 100
    ) / 100;

    private transformFromEditable = (v: number) => (this.range.max() - this.range.min()) * (v / (this.rangeEditable.max() - this.rangeEditable.min()));

    public setMin(min: number): void {
        this.minValue(min);
        this.minValueEditable(this.transformToEditable(min));
    }

    public get min(): Subscribable<number> {
        return this.minValue;
    }

    public setMax(max: number): void {
        this.maxValue(max);
        this.maxValueEditable(this.transformToEditable(max));
    }

    public get max(): Subscribable<number> {
        return this.maxValue;
    }
}