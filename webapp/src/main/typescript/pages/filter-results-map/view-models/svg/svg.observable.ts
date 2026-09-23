import { Settings } from "../../../../conf/settings.const";
import { timeout } from "../../../../util/helper/timeout/timeout";
import { ComputedNotNull, Knockout } from "../../../../util/knockout/lib/knockout.interface";
import { MessagingHandler } from "../../../../util/messaging";
import { XML, XMLTagService, createGlobalTransform } from "../../../../util/services/xml-tag-service";
import { Point2 } from "../../../../util/types/geometry/point2.type";
import { META_DATA } from "../../static/meta.data";
import { svgFrame } from "../../static/svg-frame.factory";
import { svgGLegend } from "../../static/svg-g-legend.factory";
import { SVGSettingObservable } from "../settings/svg-setting.observable";
import { CitiesSVGObservable } from "./cities-svg/cities-svg.obervable";
import { LegendBuilder } from "./legend-builder";
import { SVGBorderCompleteObservable } from "./svg-border-complete.observable";
import { SVGCantonBordersObservable } from "./svg-canton-border.observable";
import { SVGCantonNamesObservable } from "./svg-canton-names.observable";
import { SVGReliefObservable } from "./svg-relief.observable";
import { SVGTokensObservable } from "./svg-tokens/svg-tokens.observable";
import { SVGWaterLinObservable } from "./svg-water-lin.observable";
import { SVGWaterPolyObservable } from "./svg-water-poly.observable";
import { ToSVGable } from "./to-svg-able";

const FILE_BORDER_COMPLETE = 'geojson-borders-complete.json';
const FILE_WATER_LIN = 'geojson-water-lin.json';
const FILE_WATER_POLY = 'geojson-water-poly.json';
export class SVGObservable {
    private readonly xmlTagService = new XMLTagService();
    public readonly settings: SVGSettingObservable;
    public readonly svgBorderComplete: SVGBorderCompleteObservable;
    public readonly svgCantonBorders: SVGCantonBordersObservable;
    public readonly svgCantonNames: SVGCantonNamesObservable;
    public readonly svgWaterLin: ToSVGable<'g', 'water-lin'>;
    public readonly svgWaterPoly: ToSVGable<'g', 'water-poly'>;
    public readonly svgRelief: ToSVGable<'g', 'map-image'>;
    public readonly svgTokens: SVGTokensObservable;
    public readonly cities: CitiesSVGObservable;
    public readonly box: {
        readonly viewBox: {
            complete: ComputedNotNull<string>,
            x: ComputedNotNull<number>,
            width: ComputedNotNull<number>,
            height: ComputedNotNull<number>,
        };
        readonly style: ComputedNotNull<string>;
    };
    private _zoom: number;
    public get zoom() { return this._zoom; }
    public set zoom(value: number) {
        this._zoom = value;
        this.updateGlobalTransform();
    }
    private _translate: Point2;
    public get translate() { return this._translate; }
    public set translate(value: Point2) {
        this._translate = value;
        this.updateGlobalTransform();
    }

    private updateGlobalTransform() : void {
        const mapElement = document.getElementById("map-content");
        if (mapElement) {
            const metaData = META_DATA(this.zoom, this.translate);
            const transform = createGlobalTransform([metaData.svg.transformation]);
            mapElement.setAttribute("transform", transform);
        }
    }

    constructor(ko: Knockout, messageHandler: MessagingHandler) {
        this.settings = new SVGSettingObservable(ko);
        this._zoom = this.settings.navigation.zoom();
        this._translate = [
            this.settings.navigation.offsetX(),
            this.settings.navigation.offsetY()
        ];
        this.svgBorderComplete = new SVGBorderCompleteObservable(ko, FILE_BORDER_COMPLETE);
        this.svgCantonBorders = new SVGCantonBordersObservable(ko, this.settings);
        this.svgCantonNames = new SVGCantonNamesObservable(ko, this.settings);
        this.svgWaterLin = new SVGWaterLinObservable(ko, FILE_WATER_LIN, this.settings);
        this.svgWaterPoly = new SVGWaterPolyObservable(ko, FILE_WATER_POLY, this.settings);
        this.svgRelief = new SVGReliefObservable(ko, this);
        this.svgTokens = new SVGTokensObservable(ko, messageHandler, this.settings);
        this.cities = new CitiesSVGObservable(ko, this.settings);
        const self = this;
        this.settings.navigation.zoom.subscribe(value => {
            self.zoom = value;
        });
        this.settings.navigation.offsetX.subscribe(value => {
            self.translate = [value, self._translate[1]];
        });
        this.settings.navigation.offsetY.subscribe(value => {
            self.translate = [self._translate[0], value];
        });
        this.box = {
            style: ko.computed(() => {
                const format = this.settings.format.format();
                if (!format) {
                    throw new Error(`Format can't be undefined!`);
                }
                return Settings.map.frames[format].style;
            }),
            viewBox: {
                complete: ko.computed(() => {
                    const format = this.settings.format.format();
                    if (!format) {
                        throw new Error(`Format can't be undefined!`);
                    }
                    const { x, y, width, height } = Settings.map.frames[format].viewBox;
                    return `${x} ${y} ${width} ${height}`;
                }),
                x: ko.computed(() => {
                    const format = this.settings.format.format();
                    if (!format) {
                        throw new Error(`Format can't be undefined!`);
                    }
                    const { x } = Settings.map.frames[format].viewBox;
                    return x;
                }),
                width: ko.computed(() => {
                    const format = this.settings.format.format();
                    if (!format) {
                        throw new Error(`Format can't be undefined!`);
                    }
                    const { width } = Settings.map.frames[format].viewBox;
                    return width;
                }),
                height: ko.computed(() => {
                    const format = this.settings.format.format();
                    if (!format) {
                        throw new Error(`Format can't be undefined!`);
                    }
                    const { height } = Settings.map.frames[format].viewBox;
                    return height;
                }),
            },
        };
        this.settings.format.format.subscribe((format) => {
            if (!format) {
                throw new Error(`Format can't be undefined!`);
            }
            this.setFormat(format);
        });
        ko.computed<string>(() => {
            const showAreaColoring: boolean = this.settings.query.areaColoringActivated() && this.settings.query.isMinimalOneFilterVisibleAreaColoring();
            const showPiechart: boolean = this.settings.query.pieChartActivated() && this.settings.query.isMinimalOneFilterVisiblePiechart();

            const filters = this.settings.query.filters();
            const filterSvgLegend = filters.filter(filter => {
                return showAreaColoring && filter.considerWhileCreatingAreaColoring()
                    || showPiechart && filter.considerWhileCreatingPiechart();
            }).map((val, index) => svgGLegend(index, val));
            const defs = this.svgTokens.pieChartDefs();
            const pieChartUses = this.svgTokens.pieChartUses();
            const areaColoring = this.svgTokens.areaColoring();
            const childs: XML<"g">[] = [];
            childs.push(this.svgRelief.toSVG());
            if (this.settings.cardElements.showBorder()) {
                childs.push(this.svgBorderComplete.toSVG());
            }

            if (showAreaColoring) {
                childs.push(areaColoring);
            }

            childs.push(this.svgWaterLin.toSVG());
            childs.push(this.svgWaterPoly.toSVG());

            if (this.settings.cardElements.showCantonBorders()) {
                childs.push(this.svgCantonBorders.toSVG());
            }

            if (showPiechart) {
                childs.push(pieChartUses);
            }

            if (this.settings.cities.showCities()) {
                const [use, def] = this.cities.toSVG();
                defs.childs.push(def);
                childs.push(use);
            }

            if (this.settings.cardElements.showCantonNames()) {
                childs.push(this.svgCantonNames.toSVG());
            }

            const xml = svgFrame(childs, defs, this.zoom, this.translate);
            timeout(600).then(() => this.svgTokens.hoverTokensController.init());
            const svg = this.xmlTagService.xmlListToString(xml);
            const frame = document.getElementById('svg-frame');
            if (!frame) {
                return;
            }
            frame.innerHTML = svg;
            const showLegend: boolean = this.settings.cardElements.showLegend();
            if (filterSvgLegend.length <= 0) {
                return svg;
            }
            const legendBuilder = new LegendBuilder();
            legendBuilder.buildLegend(filterSvgLegend);
            if (showLegend) {
                legendBuilder.buildLegendBorder();
            } else {
                legendBuilder.removeBorder();
            }
            return svg;
        });
    }

    public setFormat(format: keyof typeof Settings.map.frames) {
        this.settings.navigation.zoom(Settings.map.frames[format].zoom);
        this.settings.navigation.offsetX(Settings.map.frames[format].translate.x);
        this.settings.navigation.offsetY(Settings.map.frames[format].translate.y);
    }


    public async init(): Promise<void> {
        await this.svgBorderComplete.init();
        await this.svgWaterLin.init();
        await this.svgWaterPoly.init();
        await this.svgRelief.init();
        await this.cities.init();
    }

}