import { ExistingNamedFilter, FilterPredicate, FiltersApi, GetTokensTableLocationsLevelEnum, MatchLocation, MatchLocationFieldEnum, NamedFilter, QueryApi } from "../../../client";
import { API_CONFIG } from "../../../conf/api.const";
import { Styles } from "../../../conf/styles.const";
import { LocationLevel } from "../../../models/locations/location.type";
import { ConfigDetailDataDetail, SearchParamsModels } from "../../../models/url/search-params.model";
import { GeneralController } from "../../../util/controller/controller.interface";
import { timeout } from "../../../util/helper/timeout/timeout";
import { Knockout } from "../../../util/knockout/lib/knockout.interface";
import { Color } from "../../../util/types/color/color.type";
import { locationsToLocationsDistancesRequest } from "../../filter-results-map/view-models/svg/svg-tokens/tokens-table-request.factory";
import { ClusterObservable, ClusterPointObservable, DEFAULT_COLOR, Group, SVG_SIZE } from "../observable/cluster.observable";
import { Circle } from "../util/circle";
import { FilterHelper } from "../util/filter-helper";
import { Projection, ProjectionResult } from "../util/projection";
import { Quadtree } from "../util/quadtree/quadtree";
import { MouseEditClusterController } from "./mouse-edit-cluster.controller";

export class ClusterController implements GeneralController {
    private readonly filterHelper = new FilterHelper();
    private readonly queryApi = new QueryApi(API_CONFIG);
    public readonly mouseEditClusterController: MouseEditClusterController;
    private filtersApi: FiltersApi;
    public readonly viewmodel;
    private readonly filterIds: number[];
    private projection: Projection | undefined = undefined;
    private readonly quadtree: Quadtree<Circle & ClusterPointObservable, any>;


    constructor(
        private ko: Knockout,
        private locationLevel: LocationLevel,
    ) {
        this.filterHelper = new FilterHelper();
        this.quadtree = new Quadtree(5, {
            upperLeft: { x: 0, y: 0 },
            lowerRight: { x: SVG_SIZE, y: SVG_SIZE },
        });
        this.filterIds = [];
        this.filtersApi = new FiltersApi(API_CONFIG);
        this.viewmodel = new ClusterObservable(ko);
        this.mouseEditClusterController = new MouseEditClusterController({
            ...this.viewmodel.clusterEdit.brush,
            mapCoordinatesFromGlobalToSVG: (x, y) => {
                const svg: SVGSVGElement = document.getElementById('clusterSvg') as unknown as SVGSVGElement;
                const transformed: SVGGElement = svg.getElementById('clusterSvgTransformed') as SVGGElement;
                const point = tranformPoint(transformed, [x, y]);
                const radius = +this.viewmodel.clusterEdit.brush.radius();
                console.log(radius);
                this.quadtree.getElements(point, radius).forEach(p => {
                    p.setGroup(this.viewmodel.groups.currentGroup());
                });
                return point;
            }
        });

        // make sure that projectionStep() is bound to this object and can safely be used as a callback function
        this.projectionStep = this.projectionStep.bind(this);
    }

    private projectionStep(state: ProjectionResult[], iteration: number, cost: number): boolean {
        const lastCost = Math.max(this.viewmodel.cost() || Number.POSITIVE_INFINITY, cost);
        this.viewmodel.cost(cost);
        this.viewmodel.steps(iteration);
        const finished = (iteration >= 500 && (1 - cost / lastCost < 5E-9)) || iteration >= 15000;
        if (finished || (iteration % 10 == 1)) {
            const existingResult = this.viewmodel.clusterPoints();
            let min = { x: Infinity, y: Infinity };
            let max = { x: -Infinity, y: -Infinity };
            if (existingResult && existingResult.length === state.length) {
                state.forEach((data, idx) => {
                    const entry = existingResult[idx];
                    const x = data.coordinates.x;
                    const y = data.coordinates.y;
                    entry.name(data.name);
                    entry.coordinates.x(x);
                    entry.coordinates.y(y);
                    min.x = Math.min(x, min.x);
                    min.y = Math.min(y, min.y);
                    max.x = Math.max(x, max.x);
                    max.y = Math.max(y, max.y);
                });
            } else {
                this.viewmodel.clusterPoints(state.map(
                    entry => {
                        const x = entry.coordinates.x;
                        const y = entry.coordinates.y;
                        min.x = Math.min(x, min.x);
                        min.y = Math.min(y, min.y);
                        max.x = Math.max(x, max.x);
                        max.y = Math.max(y, max.y);
                        return this.viewmodel.createClusterPoint(entry);
                    })
                );
            }
            const range = { x: max.x - min.x, y: max.y - min.y };
            const scale = 1 / Math.max(range.x, range.y);
            if (scale < 1) {
                this.viewmodel.offset({ x: range.x / 2, y: range.y / 2 });
                this.viewmodel.scale(scale);
            } else {
                this.viewmodel.scale(1);
                this.viewmodel.offset({ x: 0.5, y: 0.5 });
            }
        }
        return finished;
    }

    public stop() {
        this.projection?.stop();
        this.setupDrawing();
    }

    public async saveAndOpen(): Promise<number[]> {
        const ids = await this.save();
        SearchParamsModels.redirectWithParams(
            'query.html',
            ids,
            this.locationLevel as GetTokensTableLocationsLevelEnum
        );
        return ids;
    }

    public async save(): Promise<number[]> {
        const clusterMap = this.createClusterMap();
        const currentFilters = await this.currentFilters();
        const currentFilterPredicates = this.filterHelper.toPredicates(currentFilters);
        const currentFilterConjuction = this.filterHelper.toOnePredicate(currentFilterPredicates, "MatchAll");
        const ids = [];
        for (const entry of clusterMap.entries()) {
            const [cluster, values] = entry;
            const name = this.viewmodel.groups.createFilterName(cluster);
            const locationFilterPredicates = values.map(value => this.filterHelper.toMatchLocation(value, this.locationLevel));
            const locationFilterDisjunction = this.filterHelper.toOnePredicate(locationFilterPredicates, "MatchAny");
            const description = `Ergebnis der Clusteranalyse.\nAusgangsfilter: ${currentFilters.map(f => f.name).join(", ")}`;
            const filter = this.filterHelper.toOnePredicate([currentFilterConjuction, locationFilterDisjunction], "MatchAll");
            const namedFilter = this.filterHelper.createNamedfilter(name, description, filter);
            try {
                const resultPromise = this.filtersApi.createNamedFilterRaw({ namedFilter });
                this.viewmodel.getMessagingHandler().registerNavbarInfo('spinner', `Filter ${name} wird gespeichert`, 'info')
                    .until(resultPromise);
                this.viewmodel.getMessagingHandler().registerError(`Fehler beim Speichern des Filters ${name}.`)
                    .on('fail', resultPromise).until(timeout(60000));
                this.viewmodel.getMessagingHandler().registerSuccess(`Filter ${name} wurde erfolgreich gespeichert`)
                    .on('success', resultPromise).until(timeout(10000));
                const id = await resultPromise.then(result => {
                    const url: string = result.raw.headers.get("Location") as string;
                    const id = +url.slice(url.lastIndexOf('/') + 1);
                    return id;
                });
                ids.push(id);
            } catch (error: any) {
                console.error(error);
            }
        }
        return ids;
    }

    public addGroup() {
        const color = Styles.map.piecharts.palette[this.viewmodel.groups.length - 1];
        console.log(color);
        const name = this.viewmodel.groupInput.name();
        if (!name) { return; }
        this.addGroupByVals(name, color);
    }

    public addGroupByVals(name: string, color: Color): Group {
        this.viewmodel.groupInput.reset();
        const group = this.viewmodel.groups.addGroup(name, color || DEFAULT_COLOR);
        group.nameFilter.subscribe(async () => this.existsFilterNameByGroup(group));
        this.existsFilterNameByGroup(group);
        return group;
    }

    private async existsFilterNameByGroup(group: Group) {
        try {
            const existsCluster = this.viewmodel.groups.groups().find(g => g.name() === group.name() && g !== group);
            if (existsCluster) {
                const newName = window.prompt(`Der Clustername "${group.name()}" ist bereits vergeben. Bitte gib einen anderen Clusternamen ein.`, `${group.name()}`);
                if (newName) {
                    group.name(newName);
                    this.viewmodel.showSaveButton(true);
                    return;
                } else {
                    this.viewmodel.showSaveButton(false);
                }
                return;
            }
            const existsInDB = await this.existsFilterName(group.nameFilter());
            if (!existsInDB) {
                this.viewmodel.showSaveButton(true);
                return;
            }
            const newPrefix = window.prompt(`Der Filtername "${group.nameFilter()}" ist bereits vergeben. Bitte gib einen anderen Pr\u00E4fix ein. Klicke auf Abbrechen falls der Cluster umbenannt werden soll.`, `${this.viewmodel.groups.groupNamePrefix()}`);
            if (newPrefix) {
                this.viewmodel.groups.groupNamePrefix(newPrefix);
                this.viewmodel.showSaveButton(true);
                return;
            } else {
                const newName = window.prompt(`Der Filtername "${group.nameFilter()}" ist bereits vergeben. Bitte gib einen anderen Clusternamen ein.`, `${group.name()}`);
                if (newName) {
                    group.name(newName);
                    this.viewmodel.showSaveButton(true);
                    return;
                } else {
                    this.viewmodel.showSaveButton(false);
                }
            }
        } catch (error) {
            this.viewmodel.getMessagingHandler().registerError("Es konnte nicht \u00fcberpr\u00fcft werden ob der Filtername bereits existiert. Bitte \u00fcberpr\u00fcfe die Clusternamen und den Pr\u00E4fix.").show();
            this.viewmodel.showSaveButton(false);
        }
    }

    private async existsFilterName(name: string): Promise<boolean> {
        return await this.filtersApi.getFilterByName({ name }).then((success): boolean => {
            console.log(success);
            return true;
        }).catch((error) => {
            console.error(error);
            if (error.status === 404) {
                return false;
            } else {
                throw error;
            }
        });
    }

    private createClusterMap(): Map<string, string[]> {
        const clusterMap = new Map<string, string[]>();
        this.viewmodel.clusterPoints()?.forEach(point => {
            let [name, cluster] = [point.name(), point.group()];
            if (cluster) {
                const clusterList: string[] = (clusterMap.get(cluster.name()) ? clusterMap.get(cluster.name()) : []) as string[];
                clusterList.push(name);
                clusterMap.set(cluster.name(), clusterList);
            }
        });
        return clusterMap;
    }

    private async currentFilters(): Promise<ExistingNamedFilter[]> {
        const currentFilters: ExistingNamedFilter[] = await Promise.all(
            this.filterIds.map(async id => await this.filtersApi.getFilterByID({ id }))
        );
        return currentFilters;
    }

    public async init(): Promise<void> {
        this.mouseEditClusterController.init();
        const paramsOrNull = SearchParamsModels.extractURLParams();
        if (paramsOrNull !== null) {
            const params = paramsOrNull as ConfigDetailDataDetail;
            if (params.locationsLevel && params.filterIds) {
                const locationLevel = params.locationsLevel;
                params.filterIds.forEach(id => this.filterIds.push(id));
                this.locationLevel = locationLevel;
                const filtersString = this.filterIds.toString();
                const requestParameters = locationsToLocationsDistancesRequest(filtersString, this.locationLevel);
                const distancesPromise = this.queryApi.getLocationsToLocationsDistanceMatrix(requestParameters);
                this.viewmodel.getMessagingHandler().registerError(
                    'Fehler beim Laden der Distanzdaten.'
                ).on('fail', distancesPromise);
                this.viewmodel.getMessagingHandler().registerNavbarInfo(
                    'spinner', 'Lade Distanzdaten', 'info'
                ).until(distancesPromise);
                const distances = await distancesPromise;
                this.projection = new Projection(distances, this.projectionStep);
                this.viewmodel.projectionRunning(true);
                const projectionRunPromise = this.projection.run();
                this.viewmodel.getMessagingHandler().registerNavbarInfo(
                    'success', 'Distanzdaten geladen!', 'success'
                ).until(distancesPromise);
                this.viewmodel.getMessagingHandler().registerInfo(
                    "Daten werden aufbereitet. Klicke auf 'Stoppe Verfahren', wenn du mit dem Ergebnis zufrieden bist!"
                ).until(projectionRunPromise);
                projectionRunPromise.then(_ => {
                    this.viewmodel.projectionRunning(false);
                    this.setupDrawing();
                });
                const currentFilters: ExistingNamedFilter[] = await Promise.all(
                    this.filterIds.map(async id => await this.filtersApi.getFilterByID({ id }))
                );
                const currentFilterNameConcatenated = currentFilters.map(f => f.name).join(";");
                this.viewmodel.groups.groupNamePrefix(currentFilterNameConcatenated);
            }
            const defaultGroup = this.addGroupByVals("Nicht zugewiesen", "black");
            this.viewmodel.clusterPoints()?.forEach(p => p.group(defaultGroup));
            this.viewmodel.showMenu(true);
        }
    }

    private setupDrawing() {
        this.viewmodel.clusterPoints()?.forEach((p: ClusterPointObservable) => {
            let [x, y] = [parseFloat(p.rel.x()) / 100, parseFloat(p.rel.y()) / 100];
            [x, y] = [x * SVG_SIZE, y * SVG_SIZE];
            this.quadtree.insert([x, y], {
                ...{
                    center: { x, y },
                    radius: 5,
                }, ...p,
                setGroup: function (group: Group): void {
                    p.group(group);
                }
            });
        });
    }
}

export function createClusterController(ko: Knockout, locationLevel: LocationLevel): ClusterController {
    return new ClusterController(ko, locationLevel);
}