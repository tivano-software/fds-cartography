import { ViewModelObservable } from "../observable/view-model.observable";

export interface SearchQueryStrategy {
    searchQuery(viewModel: ViewModelObservable): void;
}