import { Knockout } from "../../../../../util/knockout";
import { ObservableNotNull, Subscribable } from "../../../../../util/knockout/lib/knockout.interface";
import { MessagingHandler } from "../../../../../util/messaging";
import { XML, XMLTagService } from "../../../../../util/services/xml-tag-service";
import { SVGSettingObservable } from "../../settings/svg-setting.observable";
import { MapDataArrays } from "./map-data-arrays";
import { TokensDataPreparator } from "./preparator/tokens-data-preparator";
import { timeout } from "../../../../../util/helper/timeout/timeout";
import { Settings } from "../../../../../conf/settings.const";
import { HoverTokensController } from "../../../controller/hover/hover.controller";



export class SVGTokensObservable {

    public readonly hoverTokensController: HoverTokensController;
    private readonly xmlTagService = new XMLTagService();
    private readonly data: MapDataArrays;
    public readonly areaColoring: ObservableNotNull<XML<"g">>;
    public readonly areaColoringPreparator: TokensDataPreparator;
    public readonly pieChartUses: ObservableNotNull<XML<"g">>;
    public readonly pieChartDefs: ObservableNotNull<XML<"defs">>;
    public readonly pieChartPreparator: TokensDataPreparator;
    public readonly state: ObservableNotNull<string>;


    constructor(
        private readonly ko: Knockout,
        private readonly messageHandler: MessagingHandler,
        private readonly settings: SVGSettingObservable,
    ) {
        const defaultDefs = this.xmlTagService.createDefs([]);
        const defaultTokens = this.xmlTagService.createG([]);
        this.data = new MapDataArrays(ko, messageHandler, settings);
        this.areaColoring = ko.observable<XML<'g'>>(defaultTokens);
        this.areaColoringPreparator = this.createAreaColoringPreparator();
        this.pieChartUses = ko.observable<XML<'g'>>(defaultTokens);
        this.pieChartDefs = ko.observable<XML<'defs'>>(defaultDefs);
        this.state = ko.observable<string>('');
        this.pieChartPreparator = this.createPieChartPreparator();
        this.hoverTokensController = new HoverTokensController(this.state);
    }

    public async init() {
        const watchablesPieChart: Subscribable<unknown>[] = [
            this.settings.query.pieChartActivated,
            this.settings.query.pieChartLocationLevel,
            this.settings.query.pieChartMode,
            this.settings.query.pieChartSize.min,
            this.settings.query.pieChartSize.max,
            this.settings.query.filters,
        ];
        const watchablesAreaColoring: Subscribable<unknown>[] = [
            this.settings.query.areaColoringActivated,
            this.settings.query.areaColoringLocationLevel,
            this.settings.query.areaColoringMode,
            this.settings.query.areaColoringOpacity.min,
            this.settings.query.areaColoringOpacity.max,
            this.settings.query.filters
        ];
        this.settings.query.filters().forEach(filter => {
            watchablesPieChart.push(filter.customName);
            watchablesAreaColoring.push(filter.customName);
            watchablesPieChart.push(filter.colorPieChart);
            watchablesAreaColoring.push(filter.colorAreaColoring);
            watchablesAreaColoring.push(filter.considerWhileCreatingAreaColoring);
            watchablesPieChart.push(filter.considerWhileCreatingPiechart);
        });
        watchablesPieChart.forEach(val => {
            val.subscribe(() => this.updatePieChart());
        });
        watchablesAreaColoring.forEach(val => {
            val.subscribe(() => this.updateAreaColoring());
        });
        const loadAreaColoring = this.settings.query.areaColoringActivated();
        const loadPieChart = this.settings.query.pieChartActivated();
        if (loadAreaColoring && loadPieChart) {
            const promiseAreaColoring = this.updateAreaColoring();
            const promiseUpdatePieChart = this.updatePieChart();
            await Promise.all([promiseAreaColoring, promiseUpdatePieChart]);
        } else if (loadAreaColoring) {
            await this.updateAreaColoring();
        } else if (loadPieChart) {
            await this.updatePieChart();
        }

    }

    private async updatePieChart() {
        const isMinimalOneFilterVisible = this.settings.query.isMinimalOneFilterVisiblePiechart();
        const updateAreaColoring = this.settings.query.pieChartActivated() && isMinimalOneFilterVisible;
        if (!updateAreaColoring) {
            return;
        }
        const preperator: TokensDataPreparator = this.pieChartPreparator;
        const stream = await this.data.updatePieChartData(preperator);
        const promise = stream
            .map(preperator.mapToSimpleExtendedTokenItem())
            .map(preperator.mapToExtendedTokenItemWithPieCharts())
            .fold(preperator.foldToPieChartResult());
        this.messageHandler.registerNavbarInfo('spinner', `Erstelle Tortendiagramme`).until(promise);
        this.messageHandler.registerNavbarInfo('success', `Tortendiagramme generiert`, 'success')
            .on('success', promise)
            .until(timeout(Settings.general.messaging["show-duration"]));
        this.messageHandler.registerNavbarInfo('fail', `Fehler (Tortendiagramme)`, 'danger')
            .on('fail', promise);
        const result = await promise;
        const max = result.maxOfTotal.val;
        const useList = result.useList;
        const defs = Array.from(result.symbolMap.values())
            .map(symbolFactory => symbolFactory(max));
        this.pieChartUses(this.xmlTagService.createG(useList, { id: 'piecharts' }));
        this.pieChartDefs(this.xmlTagService.createDefs(defs));
        this.hoverTokensController.initPieChart();
    }

    private async updateAreaColoring() {
        const isMinimalOneFilterVisible = this.settings.query.isMinimalOneFilterVisibleAreaColoring();
        const updateAreaColoring = this.settings.query.areaColoringActivated() && isMinimalOneFilterVisible;
        if (!updateAreaColoring) {
            return;
        }
        const preperator = this.areaColoringPreparator;
        const stream = await this.data.updateAreaColoringData(preperator);
        const promise = stream
            .map(preperator.mapToSimpleExtendedTokenItem())
            .map(preperator.mapToExtendedTokenItemWithAreaColoring())
            .fold(preperator.foldToAreaColoringResult());
        this.messageHandler.registerNavbarInfo('spinner', `Erstelle Fl\u00e4chenf\u00e4rbung`).until(promise);
        this.messageHandler.registerNavbarInfo('success', `Fl\u00e4chenf\u00e4rbung generiert`, 'success')
            .on('success', promise)
            .until(timeout(Settings.general.messaging["show-duration"]));
        this.messageHandler.registerNavbarInfo('fail', `Fehler (Fl\u00e4chenf\u00e4rbung)`, 'danger')
            .on('fail', promise)
            .until(timeout(Settings.general.messaging["show-duration"]));
        const result = await promise;
        const max = result.maxOfTotal.val;
        const list = result.areaColoringFactories.map(factory => factory(max));
        this.areaColoring(this.xmlTagService.createG(list, { id: 'areaColoring' }));
        this.hoverTokensController.initAreaColoring();
    }


    private createAreaColoringPreparator() {
        return new TokensDataPreparator(
            this.settings.query.areaColoringMode,
            this.settings.query.areaColoringLocationLevel,
            this.settings.query.filters,
            {
                min: this.settings.query.areaColoringOpacity.min,
                max: this.settings.query.areaColoringOpacity.max,
            },
            (state) => { console.log(state) }
        )
    }

    private createPieChartPreparator() {
        return new TokensDataPreparator(
            this.settings.query.pieChartMode,
            this.settings.query.pieChartLocationLevel,
            this.settings.query.filters,
            {
                min: this.settings.query.pieChartSize.min,
                max: this.settings.query.pieChartSize.max,
            },
            (state) => { console.log(state) }
        )
    }
}