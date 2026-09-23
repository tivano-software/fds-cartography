import { ExistingNamedFilter, FilterPredicate, FiltersApi, GetTokensTableLocationsLevelEnum } from "../../../client";
import { MatchEditorViewModel } from "../observable/editor/editor/match-editor.viewmodel";
import { MatchNestedFilterEditorObservable } from "../observable/editor/components/match-nested-filter-editor.observable";
import { MatchSchema } from "../observable/helper/match-schema.enum";
import { MapFilterService } from "../services/map-filter.service";
import { ParamType, URLService } from "../../../util/services/url-service/url.service";
import { GeneralController } from "../../../util/controller/controller.interface";
import { Knockout } from "../../../util/knockout/lib/knockout.interface";
import { ResponseHandleService } from "../../../util/services/api/response-handle.service";
import { SearchParamsModels } from "../../../models/url/search-params.model";
import { Settings } from "../../../conf/settings.const";
import { API_CONFIG } from "../../../conf/api.const";

export const KEY_IDENTIFIER = "identifier";


class FilterCreateController implements GeneralController {

    private readonly filtersApi: FiltersApi;
    private readonly mapFilterService: MapFilterService;
    private readonly urlService: URLService;
    private readonly responseHandleService: ResponseHandleService;

    public constructor(
        private readonly viewModel: MatchEditorViewModel,
        private readonly ko: Knockout
    ) {
        this.filtersApi = new FiltersApi(API_CONFIG);
        this.mapFilterService = new MapFilterService();
        this.urlService = new URLService();
        this.responseHandleService = new ResponseHandleService();
    }

    public init(): void {
        this.viewModel.ressources.init();
        const isIdPresent = this.urlService.isParamOfType(KEY_IDENTIFIER, ParamType.NUMBER);
        if (isIdPresent) {
            const passedId = this.urlService.getNumber(KEY_IDENTIFIER) as number;
            this.filtersApi.getFilterByID({ id: passedId })
                .then(existingNamedFilter => this.initExistingNamedFilter(existingNamedFilter))
                .catch(error => this.initIfWithWrongPassedId(error));
        } else {
            this.initIfWithoutPassedId();
        }
    }

    public initExistingNamedFilter(existingNamedFilter: ExistingNamedFilter): void {
        const editable = existingNamedFilter.editable;
        if (editable === undefined) {
            const msg = 'Dem geladenen Filter fehlt ein Wert (Editable).'
            this.viewModel.getMessagingHandler().registerError(msg).show();
            return;
        }
        const name = existingNamedFilter.name as string;
        const matchable = this.mapFilterService.mapApiToLocal(existingNamedFilter.filter, this.ko);
        this.viewModel.data.name(name.toString());
        this.viewModel.data.description(existingNamedFilter.description ?? undefined);
        this.viewModel.data.id(existingNamedFilter.id);
        this.viewModel.data.editable(editable);
        this.viewModel.data.editableAfterLoading(editable);
        this.viewModel.data.filter(matchable);
        if (!editable) {
            const msgEditable = 'Der Filter wurde gelockt gespeichert. Vor dem Bearbeiten muss er zuerst entlockt werden.';
            this.viewModel.getMessagingHandler().registerInfo(msgEditable).whileFalse(this.viewModel.data.editable);
            const msgWarning = 'Der Filter wurde gelockt gespeichert. Aktuell ist er entlockt!';
            this.viewModel.getMessagingHandler().registerError(msgWarning).whileTrue(this.viewModel.data.editable);
        }
    }

    public initIfWithoutPassedId() {
        this.viewModel.data.name("");
        this.viewModel.data.editable(true);
        const anyFilter = this.viewModel.data.setFilterToMatchAll();
        anyFilter.addMatchRegex("");
        anyFilter.addMatchLayer();
        anyFilter.addMatchLocation();
    }

    public initIfWithWrongPassedId(error: any = undefined) {
        console.error(error);
        this.initIfWithoutPassedId();
    }

    public showAddChilds(entry: MatchNestedFilterEditorObservable): boolean {
        return entry.isChildable();
    }

    public showRegexInput(entry: MatchNestedFilterEditorObservable): boolean {
        return [MatchSchema.MatchTypesRegex, MatchSchema.MatchTypesDescriptionRegex].indexOf(entry.getFilterSchema()) >= 0;
    }

    public isRoot(entry: MatchNestedFilterEditorObservable): boolean {
        return !entry.isRoot();
    }

    public showLocationInput(entry: MatchNestedFilterEditorObservable): boolean {
        return [MatchSchema.MatchLocation].indexOf(entry.getFilterSchema()) >= 0;
    }

    public showLayerInput(entry: MatchNestedFilterEditorObservable): boolean {
        return [MatchSchema.MatchLayer].indexOf(entry.getFilterSchema()) >= 0;
    }

    public showNamingMotiveInput(entry: MatchNestedFilterEditorObservable): boolean {
        return [MatchSchema.MatchNamingMotive].indexOf(entry.getFilterSchema()) >= 0;
    }

    public showLanguageCategoryInput(entry: MatchNestedFilterEditorObservable): boolean {
        return [MatchSchema.MatchLanguageCategory].indexOf(entry.getFilterSchema()) >= 0;
    }

    public async submitSaveAndOpenFilter(): Promise<void> {
        await this.submitSaveFilter();
        const id = this.viewModel.data.id();
        if (id) {
            SearchParamsModels.redirectWithParams(
                'query.html',
                [id],
                Settings.map.pieChart.defaultLocationLevel as GetTokensTableLocationsLevelEnum
            );
        }
    }

    public async submitSaveFilter(): Promise<void> {
        this.viewModel.getMessagingHandler().clearAll();
        const validator = this.viewModel.getValidator();
        const valid = validator.validate();
        if(!valid) {
            const errors = validator.error();
            console.error(errors);
            return;
        }
        let filter;
        try {
            filter = this.mapFilterService.mapLocalToApi(this.viewModel.data.getFilter());
        } catch (exception) {
            this.viewModel.getMessagingHandler().registerError(exception as string).show();
            return;
        }
        const name = this.viewModel.data.name() as string;
        const editable = this.viewModel.data.editable();
        const id = this.viewModel.data.id();
        const description = this.viewModel.data.description();
        const promise = id !== undefined
            ? this.submitUpdateFilter(id, name, filter, editable, description)
            : this.submitCreateNewFilter(name, filter, editable, description);
        await promise;
    }

    public async submitCreateNewFilter(name: string, filter: FilterPredicate, editable: boolean, description: string | undefined): Promise<void> {
        return await this.filtersApi.createNamedFilterRaw({
            namedFilter: { name, filter, editable, description }
        }).then(async success => {
            this.viewModel.getMessagingHandler().registerSuccess("Der Filter wurde erfolgreich gespeichert.").show();
            return await this.filtersApi.getFilterByName({name}).then(value => this.viewModel.data.id(value.id))
        }).catch(async (error: Response) => {
            this.responseHandleService.handleResponseError(error, this.viewModel);
        });
    }

    public async submitUpdateFilter(id: number, name: string | undefined, filter: FilterPredicate, editable: boolean, description: string | undefined): Promise<void> {
        return await this.filtersApi.updateFilterRaw({
            id, namedFilter: { name, filter, editable, description }
        }).then(async success => {
            this.viewModel.getMessagingHandler().registerSuccess("Der Filter wurde erfolgreich aktualisiert.").show();
        }).catch((error: Response) => {
            this.responseHandleService.handleResponseError(error, this.viewModel);
        });
    }
}


function filterControllerOf(viewModel: MatchEditorViewModel, ko: Knockout): FilterCreateController {
    return new FilterCreateController(viewModel, ko);
}

export { filterControllerOf };