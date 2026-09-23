import { ApiResponse, TokensTableRow } from "../../../client";
import { ViewModelObservable } from "../observable/view-model.observable";
import { SearchQueryStrategy } from "./search-query-strategy.interface";
import { SearchQueryStrategyTemplate } from "./search-query-strategy.template";

const MSG = {
    infoLoading: "Daten werden geladen. Bitte warten...",
    infoPreparing: "Daten sind geladen, sie werden aufbereitet...",
    errorFilter: "Mindestens ein Filter muss angegeben werden.",
    successLoaded: "Die Daten wurden erfolgreich geladen.",
};

export class SearchQueryStrategyJSON
    extends SearchQueryStrategyTemplate
    implements SearchQueryStrategy
{
    constructor() {
        super(MSG, undefined);
    }

    async proceedResults(result: ApiResponse<TokensTableRow[]>, viewModel: ViewModelObservable): Promise<void> {
        const json = await result.value();
        viewModel.table.getPageStateHandler().reset();
        viewModel.table.addTokens(json);
    }
}