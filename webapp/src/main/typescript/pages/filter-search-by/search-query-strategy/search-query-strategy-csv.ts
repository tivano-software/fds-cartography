import { ApiResponse, BlobApiResponse, TokensTableRow } from "../../../client";
import { DownloadService } from "../../../util/services/load/download.service";
import { FileNameString } from "../../../util/types/template-types/file-name-string.type";
import { ViewModelObservable } from "../observable/view-model.observable";
import { SearchQueryStrategy } from "./search-query-strategy.interface";
import { SearchQueryStrategyTemplate } from "./search-query-strategy.template";

export class SearchQueryStrategyCSV
    extends SearchQueryStrategyTemplate
    implements SearchQueryStrategy
{
    private static DEFAULT_TITLE: FileNameString<'csv'> = 'download.csv';
    private static MSG = {
        infoLoading: "Daten werden geladen. Bitte warten...",
        infoPreparing: "Daten sind geladen, sie werden aufbereitet...",
        errorFilter: "Mindestens ein Filter muss angegeben werden.",
        successLoaded: "Die Daten wurden erfolgreich heruntergeladen.",
    };
    private readonly downloadService = new DownloadService();

    constructor(
        private readonly csvTitle?: FileNameString<'csv'>
    ) {
        super(SearchQueryStrategyCSV.MSG, { 'accept': 'text/csv' });
    }

    async proceedResults(result: ApiResponse<TokensTableRow[]>, viewModel: ViewModelObservable): Promise<void> {
        const blobResponse = new BlobApiResponse(result.raw);
        const blob = await blobResponse.value();
        this.downloadService.downloadBlob(blob, this.csvTitleOrDefault)
        return new Promise((resolve, reject) => resolve());
    }

    private get csvTitleOrDefault(): FileNameString<'csv'> {
        if (this.csvTitle === undefined) {
            return SearchQueryStrategyCSV.DEFAULT_TITLE;
        } else {
            return this.csvTitle;
        }
    }
}