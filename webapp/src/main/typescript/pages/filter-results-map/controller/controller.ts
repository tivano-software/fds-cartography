import { ConfigDetailDataDetail, ConfigDetailDataId, ConfigDetailDataModel, SearchParamsModels } from "../../../models/url/search-params.model";
import { GeneralController } from "../../../util/controller/controller.interface";
import { Knockout } from "../../../util/knockout";
import { FiltersAPIService } from "../../../util/services/api/filters-api.service";
import { Base64Service } from "../../../util/services/load/base64.service";
import { ColorService } from "../../../util/services/color/color.service";
import { MoveMapController } from "./move-map.controller";
import { ViewModel } from "../view-models/view-model";
import { ExistingNamedFilter, GetTokensTableLocationsLevelEnum } from "../../../client";
import { Color } from "../../../util/types/color/color.type";
import { ConfigDef, ConfigFilter, ConfigType } from "../../generic-config/model/config.enum";
import { Settings } from "../../../conf/settings.const";
import { timeout } from "../../../util/helper/timeout/timeout";
import { DeepPartial } from "../../../util/types/util-types/partial-types/deep-partial.type";
import { ifSet } from "../../../util/types/then-catch/if-set.function";
import { DownloadService } from "../../../util/services/load/download.service";
import { LoadService } from "../../../util/services/load/load.service";
import { CONFIG_MAP_SERVICE } from "../../generic-config/services/config-map.service.const";
import { FilterData } from "../view-models/settings/filter-data";
import { FilenameService } from "../services/filename.service";

export class FilterResultsController implements GeneralController {

    private readonly moveMapController: MoveMapController;
    private readonly filtersApiService = new FiltersAPIService();
    private readonly colorService = new ColorService();
    private readonly downloadService = new DownloadService();
    private readonly base64Service = new Base64Service();
    private readonly loadService = new LoadService();

    constructor(
        private readonly viewModel: ViewModel,
        private readonly ko: Knockout
    ) {
        this.moveMapController = new MoveMapController(viewModel);
    }

    public async init(): Promise<void> {
        await this.viewModel.init();
        this.moveMapController.init();
        const onFailure = (info?: any) => {
            const msg = 'Fehler beim Laden der Daten.' + (info ? ' ' + info : '');
            this.viewModel.getMessagingHandler().clearAll();
            this.viewModel.getMessagingHandler().registerError(msg).show();
        };
        const urlParams: ConfigDetailDataModel | null = SearchParamsModels.extractURLParams();
        if ((urlParams as ConfigDetailDataId).configId) {
            const configId = (urlParams as ConfigDetailDataId).configId;
            this.viewModel.svg.settings.configId(configId);
            const config = await CONFIG_MAP_SERVICE.findOneById(configId);
            if (config.json && config.name) {
                this.viewModel.svg.settings.name(config.name);
                await this.initDetails(config.json);
            } else {
                throw new Error('Beim Laden des JSON oder des Namens ist ein Fehler aufgetreten.');
            }
        } else if ((urlParams as ConfigDetailDataDetail).filterIds && (urlParams as ConfigDetailDataDetail).locationsLevel) {
            await this.initDetails({
                filterIds: (urlParams as ConfigDetailDataDetail).filterIds,
                pieChart: {
                    locationLevel: (urlParams as ConfigDetailDataDetail).locationsLevel,
                },
                areaColoring: {
                    locationLevel: (urlParams as ConfigDetailDataDetail).locationsLevel,
                }
            });
        } else if (!urlParams) {
            const info = 'Es wurden keine Paramter mitgegeben.';
            onFailure(info);
            return;
        }
    }

    private async initDetails(data: DeepPartial<ConfigDef<ConfigType.MAP> & { filterIds: number[] }>) {


        const r = ifSet(data.filterIds)
            .then(ids => this.filtersApiService.findByIdList(ids))
            .otherwise(() => this.filtersApiService.extendFilters(data.filters ? data.filters : []));
        const filtersRaw = data.filterIds ?
            await this.filtersApiService.findByIdList(data.filterIds) :
            await this.filtersApiService.extendFilters(data.filters ? data.filters : []);
        try {
            const logError = (msg: string) => (() => console.error(msg));
            const colors = this.colorService.createColors(filtersRaw.length);
            const filters = this.createFilterData(filtersRaw, colors);
            this.viewModel.svg.settings.query.filters(filters);

            ifSet(data.generalSettings).then(settings => {
                ifSet(settings.format).then(this.viewModel.svg.settings.format.format)
                    .otherwise(() => this.viewModel.svg.settings.format.format("3:2"));
                ifSet(settings.backgroundOpacity).then(this.viewModel.svg.settings.cardElements.backgroundOpacity);
                ifSet(settings.riverSize).then(this.viewModel.svg.settings.cardElements.riverSize);
                ifSet(settings.showBorder)
                    .then(logError(`generalSettings.showBorder is ignored because of new specification`))
                    .otherwise(logError(`generalSettings.showBorder is not present.`));
                ifSet(settings.showLegend).then(this.viewModel.svg.settings.cardElements.showLegend);
                ifSet(settings.cities).then(cities => {
                    ifSet(cities.showCities).then(show => this.viewModel.svg.settings.cities.showCities(show));
                    ifSet(cities.threshold).then(threshold => this.viewModel.svg.settings.cities.threshold(threshold));
                });
                ifSet(settings.zoom).then(v => this.viewModel.svg.settings.navigation.zoom(v));
                ifSet(settings.position).then(nav => {
                    ifSet(nav.x).then(v => this.viewModel.svg.settings.navigation.offsetX(v));
                    ifSet(nav.y).then(v => this.viewModel.svg.settings.navigation.offsetY(v));
                });
                ifSet(settings.showCantonBorders).then(v => this.viewModel.svg.settings.cardElements.showCantonBorders(v));
                ifSet(settings.showCantonNames).then(v => this.viewModel.svg.settings.cardElements.showCantonNames(v));
            });

            ifSet(data.pieChart).then(pieChart => {
                ifSet(pieChart.isActive).then(this.viewModel.svg.settings.query.pieChartActivated);
                ifSet(pieChart.locationLevel).then(this.viewModel.svg.settings.query.pieChartLocationLevel);
                ifSet(pieChart.mode)
                    .then(mode => this.viewModel.svg.settings.query.pieChartMode(mode))
                    .otherwise(() => {
                        ifSet(pieChart.isRelative).then(relative => {
                            if (relative) {
                                this.viewModel.svg.settings.query.pieChartMode('relative');
                            } else {
                                this.viewModel.svg.settings.query.pieChartMode('absolut');
                            }
                        }).otherwise(logError('pieChart.isRelative is not present.'));
                    });
                ifSet(pieChart.range).andIfSet(range => range.max).then(max => this.viewModel.svg.settings.query.pieChartSize.setMax(max));
                ifSet(pieChart.range).andIfSet(range => range.min).then(min => this.viewModel.svg.settings.query.pieChartSize.setMin(min));
            });

            ifSet(data.areaColoring).then(areaColoring => {
                ifSet(areaColoring.isActive).then(this.viewModel.svg.settings.query.areaColoringActivated);
                ifSet(areaColoring.locationLevel).then(this.viewModel.svg.settings.query.areaColoringLocationLevel);
                ifSet(areaColoring.mode)
                    .then(mode => this.viewModel.svg.settings.query.areaColoringMode(mode))
                    .otherwise(() => {
                        ifSet(areaColoring.isRelative).then(relative => {
                            if (relative) {
                                this.viewModel.svg.settings.query.areaColoringMode('relative');
                            }
                        });
                        ifSet(areaColoring.isAbsolute).then(absolute => {
                            if (absolute) {
                                this.viewModel.svg.settings.query.areaColoringMode('absolut');
                            }
                        });
                        ifSet(areaColoring.isDistribution).then(distribution => {
                            if (distribution) {
                                this.viewModel.svg.settings.query.areaColoringMode('distribution');
                            }
                        });
                    });
                ifSet(areaColoring.range).andIfSet(range => range.max)
                    .then(max => this.viewModel.svg.settings.query.areaColoringOpacity.setMax(max));
                ifSet(areaColoring.range).andIfSet(range => range.min)
                    .then(min => this.viewModel.svg.settings.query.areaColoringOpacity.setMin(min));
            }).otherwise(logError('areaColoring is not present.'));

        } catch (exception) {
            const info = `Beim Mappen der Filter ist ein Fehler aufgetreten (${exception}).`;
            const msg = 'Fehler beim Laden der Daten.' + (info ? ' ' + info : '');
            this.viewModel.getMessagingHandler().clearAll();
            this.viewModel.getMessagingHandler().registerError(msg).show();
            return;
        }
        await this.viewModel.svg.svgTokens.init();
        if (!data.generalSettings) {
            this.viewModel.svg.settings.format.format("3:2");
            this.viewModel.svg.setFormat("3:2");
        }
    }

    private createFilterData(existingNamedFilters: (ExistingNamedFilter & Partial<ConfigFilter>)[], colors: Color[]): FilterData[] {
        const filters: FilterData[] = existingNamedFilters.map((val, index) => ({
            // Map to remove undefined
            ...val,
            id: ifSet(val.id).orDefault(-1),
            name: ifSet(val.name).orDefault(''),
            color: colors[index],
            customName: ifSet(val.customName).orDefault(ifSet(val.name).orDefault('')),
            colorAreaColoring: ifSet(val.colorAreaColoring).orDefault(index<colors.length?colors[index]:colors[colors.length-1]),
            colorPieChart: ifSet(val.colorPieChart).orDefault(colors[index]),
            areaColoringActive: ifSet(val.areaColoringActive).orDefault(true),
            pieChartActive: ifSet(val.pieChartActive).orDefault(true)
        })).map((data): FilterData => new FilterData(this.ko, data));
        return filters;
    }

    public nav(direction: 'up' | 'down' | 'left' | 'right' | 'zoom-in' | 'zoom-out'): void {
        const stepMove = this.moveMapController.stepMove;
        const stepZoom = this.moveMapController.stepZoom;
        switch (direction) {
            case 'up':
                this.moveMapController.navMove(0, stepMove);
                return;
            case 'down':
                this.moveMapController.navMove(0, -stepMove);
                return;
            case 'left':
                this.moveMapController.navMove(-stepMove, 0);
                return;
            case 'right':
                this.moveMapController.navMove(stepMove, 0);
                return;
            case 'zoom-out':
                this.moveMapController.navZoom(stepZoom);
                return;
            case 'zoom-in':
                this.moveMapController.navZoom(-stepZoom);
                return;
        }
    }


    public openQuerySettings(): void {
        const filterIds = this.viewModel.svg.settings.query.filters().map(filter => filter.id())
        const locationsLevel = this.viewModel.svg.settings.query.pieChartLocationLevel()
        SearchParamsModels.redirectWithParams(
            'query.html',
            filterIds,
            locationsLevel as GetTokensTableLocationsLevelEnum
        );
    }

    public async saveMap(): Promise<void> {
        this.viewModel.getMessagingHandler().clearAll();
        if (!this.viewModel.svg.settings.name()) {
            this.viewModel.getMessagingHandler()
                .registerError('Vor dem Speichern muss eine Kartenbezeichnung angegeben werden!')
                .until(timeout(Settings.general.messaging["show-duration"]));
            return;
        }
        const promise = CONFIG_MAP_SERVICE.createOrUpdate({
            name: this.viewModel.svg.settings.name(),
            json: {
                filters: this.viewModel.svg.settings.query.filters().map(filter => ({
                    id: filter.id(),
                    customName: filter.customName(),
                    colorAreaColoring: filter.colorAreaColoring(),
                    colorPieChart: filter.colorPieChart(),
                    areaColoringActive: filter.considerWhileCreatingAreaColoring(),
                    pieChartActive: filter.considerWhileCreatingPiechart(),
                })),
                pieChart: {
                    mode: this.viewModel.svg.settings.query.pieChartMode(),
                    locationLevel: this.viewModel.svg.settings.query.pieChartLocationLevel(),
                    isRelative: this.viewModel.svg.settings.query.pieChartMode() === 'relative',
                    isActive: this.viewModel.svg.settings.query.pieChartActivated(),
                    range: {
                        max: this.viewModel.svg.settings.query.pieChartSize.max(),
                        min: this.viewModel.svg.settings.query.pieChartSize.min(),
                    },
                },
                areaColoring: {
                    mode: this.viewModel.svg.settings.query.areaColoringMode(),
                    locationLevel: this.viewModel.svg.settings.query.areaColoringLocationLevel(),
                    isRelative: this.viewModel.svg.settings.query.areaColoringMode() === 'relative',
                    isActive: this.viewModel.svg.settings.query.areaColoringActivated(),
                    isAbsolute: this.viewModel.svg.settings.query.areaColoringMode() === 'absolut',
                    isDistribution: this.viewModel.svg.settings.query.areaColoringMode() === 'distribution',
                 range: {
                        max: this.viewModel.svg.settings.query.areaColoringOpacity.max(),
                        min: this.viewModel.svg.settings.query.areaColoringOpacity.min(),
                    },
                },
                generalSettings: {
                    showLegend: this.viewModel.svg.settings.cardElements.showLegend(),
                    showBorder: this.viewModel.svg.settings.cardElements.showBorder(),
                    showCantonBorders: this.viewModel.svg.settings.cardElements.showCantonBorders(),
                    showCantonNames: this.viewModel.svg.settings.cardElements.showCantonNames(),
                    riverSize: this.viewModel.svg.settings.cardElements.riverSize(),
                    backgroundOpacity: this.viewModel.svg.settings.cardElements.backgroundOpacity(),
                    cities: {
                        threshold: this.viewModel.svg.settings.cities.threshold(),
                        showCities: this.viewModel.svg.settings.cities.showCities()
                    },
                    zoom: this.viewModel.svg.settings.navigation.zoom(),
                    position: {
                        x: this.viewModel.svg.settings.navigation.offsetX(),
                        y: this.viewModel.svg.settings.navigation.offsetY(),
                    },
                    format: this.viewModel.svg.settings.format.format(),
                }
            }
        }, this.viewModel.svg.settings.configId());
        this.viewModel.getMessagingHandler()
            .registerError(`Die Karte konnte nicht gespeichert werden. Gegebenfalls wurde der Name bereits vergeben.`)
            .on('fail', promise)
            .until(timeout(Settings.general.messaging["show-duration"]));
        this.viewModel.getMessagingHandler()
            .registerSuccess(`Die Karte wurde erfolgreich gespeichert.`)
            .on('success', promise)
            .until(timeout(Settings.general.messaging["show-duration"]));
        promise.then(result => {
            ifSet(result.id).then(id => {
                this.viewModel.svg.settings.configId(id);
            });
        });
        await promise;
    }

    public formatOptions(): { name: string }[] {
        const result: { name: string }[] = [];
        for (const key in Settings.map.frames) {
            console.log(key);
            result.push({ name: key });
        }
        console.log(result);
        return result;
    }

    public async downloadSVG(): Promise<void> {

        const filenameService = new FilenameService();
        const fileName = filenameService.generate(this.viewModel);
        if (!fileName) {
            return;
        }

        let svg = document.getElementById('map-div')?.innerHTML;
        const filters = this.viewModel.svg.settings.query.filters().map(filter => filter.name());
        if (svg === undefined || filters.length === 0) {
            throw 'svg is not defined.';
        }
        const imageURL = 'data/topography.png';
        const image = await this.loadService.loadBlob(imageURL);
        const imageBase64 = await this.base64Service.blobToBase64(image);
        const imageLinkRegex = /<image href=\"[^\"]*\"/;
        const svgViewBoxRegex = /^<svg [^>]* viewBox=\"(\d+) (\d+) (\d+) (\d+)\" *([^>]*)>/;
        if (imageBase64) {
            // Use the (deprecated) xlink:href because many client programs (including Gimp for Windows)
            // work with xlink:href but not with the standard href from SVG2
            svg = svg.replace(imageLinkRegex, `<image xlink:href="${imageBase64?.toString()}"`);
        } else {
            svg = svg.replace(imageLinkRegex, '<image ');
        }
        // Add a white rectangle over the complete view box to explicitly set an opaque background,
        // and make sure that the <svg> tag has only a viewBox attribute but no width and height.
        // We are using this here instead of style="background-color: white" on the <svg> tag
        // to cater to client programs that don't honor the style attribute on the SVG tag and
        // cannot cope with both width/height and viewBox

        svg = svg.replace(svgViewBoxRegex, '<svg viewBox="$1 $2 $3 $4" $5><rect x="$1" y="$2" width="$3" height="$4" fill="white"/>');
        const blob = new Blob([svg], { type: 'text/plain' });
        this.downloadService.downloadBlob(blob, fileName);
    }

}

export function controllerOf(viewModel: ViewModel, ko: Knockout): FilterResultsController {
    return new FilterResultsController(viewModel, ko);
}