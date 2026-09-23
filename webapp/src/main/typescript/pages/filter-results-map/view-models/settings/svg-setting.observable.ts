import { Settings } from "../../../../conf/settings.const";
import { LocationLevel } from "../../../../models/locations/location.type";
import { Knockout } from "../../../../util/knockout";
import { Observable, ObservableArray, ObservableNotNull } from "../../../../util/knockout/lib/knockout.interface";
import { SVG_TRANSFORM_TRANSLATE, SVG_ZOOM_FACTOR } from "../../static/meta.data";
import { FilterData } from "./filter-data";
import { Range } from './range.class';

export type DataRepresentationMode = 'absolut' | 'relative' | 'incidence' | 'distribution';

export class SVGSettingObservable {

    public readonly configId: Observable<number>;
    public readonly name: Observable<string | undefined>;

    public readonly query: {
        readonly filters: ObservableArray<FilterData>;
        readonly pieChartActivated: ObservableNotNull<boolean>;
        readonly pieChartLocationLevel: ObservableNotNull<LocationLevel>;
        readonly pieChartMode: ObservableNotNull<DataRepresentationMode>;
        readonly pieChartSize: Range;
        readonly areaColoringActivated: ObservableNotNull<boolean>;
        readonly areaColoringLocationLevel: ObservableNotNull<LocationLevel>;
        readonly areaColoringMode: ObservableNotNull<DataRepresentationMode>;
        readonly areaColoringOpacity: Range;
        readonly isMinimalOneFilterVisibleAreaColoring: () => boolean;
        readonly isMinimalOneFilterVisiblePiechart: () => boolean;
    }

    public readonly cities: {
        readonly showCities: ObservableNotNull<boolean>;
        readonly threshold: ObservableNotNull<number>;
        readonly thresholdRange: {
            readonly min: ObservableNotNull<number>;
            readonly max: ObservableNotNull<number>;
        }
    }

    public readonly format: {
        format: Observable<keyof (typeof Settings.map.frames)>;
    }

    public readonly navigation: {
        readonly zoom: ObservableNotNull<number>;
        readonly offsetX: ObservableNotNull<number>;
        readonly offsetY: ObservableNotNull<number>;
    }

    public readonly cardElements: {
        readonly showLegend: ObservableNotNull<boolean>;
        readonly showBorder: ObservableNotNull<boolean>;
        readonly backgroundOpacity: ObservableNotNull<number>;
        readonly riverSize: ObservableNotNull<number>;
        readonly showCantonBorders: ObservableNotNull<boolean>;
        readonly showCantonNames: Observable<boolean>;
    }

    constructor(readonly ko: Knockout) {
        this.configId = ko.observable(undefined);
        this.name = ko.observable(undefined);
        this.query = {
            filters: ko.observableArray<FilterData>([]),
            pieChartActivated: ko.observable(Settings.map.pieChart.defaultActivated),
            pieChartLocationLevel: ko.observable(Settings.map.pieChart.defaultLocationLevel),
            pieChartMode: ko.observable(Settings.map.pieChart.defaultMode),
            pieChartSize: new Range(ko, Settings.map.pieChart.defaultSizeRange, {
                range: Settings.map.pieChart.oldRange,
                rangeEditable: Settings.ui.range
            }),
            areaColoringActivated: ko.observable(Settings.map.areaColoring.defaultActivated),
            areaColoringLocationLevel: ko.observable(Settings.map.areaColoring.defaultLocationLevel),
            areaColoringMode: ko.observable(Settings.map.areaColoring.defaultMode),
            areaColoringOpacity: new Range(ko, {
                min: Settings.map.areaColoring.defaultOpacityRangeMin,
                max: Settings.map.areaColoring.defaultOpacityRangeMax
            }, {
                range: Settings.map.areaColoring.oldRange,
                rangeEditable: Settings.ui.range
            }),
            isMinimalOneFilterVisibleAreaColoring: (): boolean => {
                return this.query.filters()
                    .map(f => f.considerWhileCreatingAreaColoring())
                    .reduce((pr, cu) => pr || cu, false);
            },
            isMinimalOneFilterVisiblePiechart: (): boolean => {
                return this.query.filters()
                    .map(f => f.considerWhileCreatingPiechart())
                    .reduce((pr, cu) => pr || cu, false);
            },
        };
        this.cities = {
            showCities: ko.observable(Settings.map.elements.cities.showCities),
            threshold: ko.observable(Settings.map.elements.cities.threshold),
            thresholdRange: {
                min: ko.observable(Settings.map.elements.cities.thresholdRange.min),
                max: ko.observable(Settings.map.elements.cities.thresholdRange.max),
            }
        };
        this.navigation = {
            zoom: ko.observable(SVG_ZOOM_FACTOR),
            offsetX: ko.observable(SVG_TRANSFORM_TRANSLATE[0]),
            offsetY: ko.observable(SVG_TRANSFORM_TRANSLATE[1]),
        };
        this.cardElements = {
            showLegend: ko.observable(false),
            showBorder: ko.observable(true),
            backgroundOpacity: ko.observable(Settings.map.elements.relief.defaultOpacity),
            riverSize: ko.observable(Settings.map.elements.water.riverSize),
            showCantonBorders: ko.observable(true),
            showCantonNames: ko.observable(true)
        };
        this.format = {
            format: ko.observable("3:2")
        }

    }
}

