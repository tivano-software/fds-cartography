import { ComputedNotNull, Knockout } from "../../../../../util/knockout/lib/knockout.interface";
import { MatchAbstractObservable } from "../../components/match-abstract.observable";
import { FilterEditorFactory } from "./filter-editor.factory";
import { MatchAbstractEditorObservable } from "../components/match-abstract-editor.observable";
import { MapFilterService } from "../../../services/map-filter.service";
import { Validable, Validator } from "../../../../../util/validation";
import { FilterEditorStaticRessources } from "./filter-static-ressources";
import { Messageable } from "../../../../../util/messaging/messageable.interface";
import { MessagingHandler, MessagingObservable } from "../../../../../util/messaging";
import { FilterEditorData } from "./filter-editor-data";

export interface MatchEditorViewModel extends
    Validable,
    Messageable
{
    messages: MessagingObservable;
    ressources: FilterEditorStaticRessources;
    data: FilterEditorData;
    filterEditorList: ComputedNotNull<MatchAbstractEditorObservable[]>;
}

class MatchEditorViewModelDefault implements MatchEditorViewModel {
    private readonly mapFilterService: MapFilterService;
    private readonly matchFilterFactory: FilterEditorFactory;

    public readonly messages: MessagingObservable;
    public readonly ressources: FilterEditorStaticRessources;
    public readonly data: FilterEditorData;
    public readonly filterEditorList: ComputedNotNull<MatchAbstractEditorObservable[]>;
    public readonly filterIsEmpty: ComputedNotNull<boolean>;

    constructor(private ko: Knockout) {
        this.ressources = new FilterEditorStaticRessources(ko);
        this.data = new FilterEditorData(ko);
        this.mapFilterService = new MapFilterService();
        this.matchFilterFactory = new FilterEditorFactory(ko);
        this.filterEditorList = ko.computed(() => this.createFilterEditorList());
        this.filterIsEmpty = ko.computed(() => this.data.getFilter() === undefined);
        this.messages = new MessagingObservable(ko);
        this.getMessagingHandler().registerValidator(this);
    }

    private createFilterEditorList(): MatchAbstractEditorObservable[] {
        if (this.data.getFilter() === undefined) {
            return []
        }
        const list = this.matchFilterFactory.create(this.data.getFilter() as MatchAbstractObservable);
        return list;
    }

    getMessagingHandler(): MessagingHandler {
        return new MessagingHandler(this.messages);
    }

    getValidator(): Validator {
        return this.data.getValidator();
    }
}

export function createCreateFilter(ko: Knockout): MatchEditorViewModel {
    return new MatchEditorViewModelDefault(
        ko
    );
}