import { ApiResponse, GetTokensTableLocationsLevelEnum, GetTokensTableRequest, GetTokensTableTypesLevelEnum, QueryApi, TokensTableRow } from "../../../client";
import { API_CONFIG } from "../../../conf/api.const";
import { ResponseHandleService } from "../../../util/services/api/response-handle.service";
import { ViewModelObservable } from "../observable/view-model.observable";
import { SearchQueryStrategy } from "./search-query-strategy.interface";

export interface SearchQueryStrategyTemplateMessages {
    errorFilter: string;
    infoLoading: string;
    infoPreparing: string;
    successLoaded: string;
}

export abstract class SearchQueryStrategyTemplate implements SearchQueryStrategy {

    private responseHandleService: ResponseHandleService;
    private queryAPI: QueryApi;

    constructor(
        private readonly messages: SearchQueryStrategyTemplateMessages,
        private readonly headers: HeadersInit | undefined,
    ) {
        this.responseHandleService = new ResponseHandleService();
        this.queryAPI = new QueryApi(API_CONFIG);
    }

    public async searchQuery(viewModel: ViewModelObservable): Promise<void> {
        viewModel.clearResults();
        if (viewModel.form.chosenFilterIds.length === 0) {
            viewModel.getMessagingHandler().registerError(this.messages.errorFilter).show();
            return;
        }
        const request = this.getTokensTableRequestObject(viewModel);
        const promise = this.queryAPI.getTokensTableRaw(request, { headers: this.headers });
        viewModel.getMessagingHandler().registerInfo(this.messages.infoLoading).until(promise);
        await promise.then(async result => {
            const proceedResultsPromise = this.proceedResults(result, viewModel);
            await viewModel.getMessagingHandler().registerInfo(this.messages.infoPreparing).until(proceedResultsPromise);
            viewModel.getMessagingHandler().registerSuccess(this.messages.successLoaded).show();
        }).catch(error => {
            this.responseHandleService.handleResponseError(error, viewModel);
        });
    }

    abstract proceedResults(result: ApiResponse<TokensTableRow[]>, viewModel: ViewModelObservable): Promise<void>;

    getTokensTableRequestObject(
        viewModel: ViewModelObservable
    ): GetTokensTableRequest {
        const filtersList: number[] = viewModel.form.chosenFilterIds;
        const filters =  filtersList.map(id => id + '').join(',');
        const outerGroup = viewModel.form.tokensTableOuterGroupValue();
        const innerGroup = viewModel.form.tokensTableInnerGroupValue();
        const typesLevel = viewModel.form.tokensTableTypesLevelValue();
        const locationsLevel = viewModel.form.tokensTableLocationsLevelValue();
        const result: GetTokensTableRequest = {
            filters,
            outerGroup,
            innerGroup,
            locationsLevel: locationsLevel as GetTokensTableLocationsLevelEnum,
            typesLevel
        };
        return result;
    }

}