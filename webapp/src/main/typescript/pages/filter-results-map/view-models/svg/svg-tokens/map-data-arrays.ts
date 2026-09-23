import { Knockout } from "../../../../../util/knockout";
import { MessagingHandler } from "../../../../../util/messaging";
import { AsyncStreamI } from "../../../../../util/types/stream/async-stream";
import { GeometryData } from "../../data/map-data-item";
import { SVGSettingObservable } from "../../settings/svg-setting.observable";
import { MapDataArray } from "./map-data-array";
import { TokensDataPreparator } from "./preparator/tokens-data-preparator";

export class MapDataArrays {

    public readonly pieChartData: MapDataArray;
    public readonly areaColoringData: MapDataArray;

    constructor(
        private readonly ko: Knockout,
        private readonly messageHandler: MessagingHandler,
        private readonly settings: SVGSettingObservable,
    ) {
        this.pieChartData = new MapDataArray(
            this.ko,
            this.messageHandler,
            'Tortendiagramme',
            'point',
            this.settings.query.pieChartLocationLevel(),
            this.settings.query.filters()
        );
        this.areaColoringData = new MapDataArray(
            this.ko,
            this.messageHandler,
            'Fl\u00e4chenf\u00e4rbung',
            'poly',
            this.settings.query.areaColoringLocationLevel(),
            this.settings.query.filters()
        );
    }

    public async updatePieChartData(preparator: TokensDataPreparator): Promise<AsyncStreamI<GeometryData>> {
        return await this.pieChartData.update(
            this.settings.query.pieChartLocationLevel(),
            this.settings.query.filters(),
            preparator
        );
    }

    public async updateAreaColoringData(preparator: TokensDataPreparator): Promise<AsyncStreamI<GeometryData>> {
        return await this.areaColoringData.update(
            this.settings.query.areaColoringLocationLevel(),
            this.settings.query.filters(),
            preparator
        );
    }

}