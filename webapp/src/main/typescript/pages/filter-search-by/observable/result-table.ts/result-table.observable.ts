import { TokensEntry, TokensTableRow } from "../../../../client";
import { Computed, Knockout } from "../../../../util/knockout";
import { WatchableNotNull } from "../../../../util/knockout/lib/knockout.interface";
import { PageStateHandler } from "../../../../util/knockout/list/page-state-handler.observable";
import { UndefinedNullableService } from "../../../../util/services/undefined-nullable.service";
import { MapDoubleKeyObservable } from "../../../../util/types/maps";
import { MapObservable } from "../../../../util/types/maps/map.observable";
import { Filter, FilterNotNull } from "../form/form.observable";

export class ResultTableObservable {
    private static readonly NUMBER_OF_LINES_PER_PAGE = 100;
    private static readonly NUMBER_OF_ELEMENTS_PER_LINE = 100;
    private readonly undefinedNullableService: UndefinedNullableService;
    public readonly titlesRow: Computed<string[]>;
    public readonly titlesColumn: Computed<string[]>;
    public readonly isEmpty: Computed<boolean>;
    public readonly map: MapDoubleKeyObservable<string, string, number>;
    public readonly resultsTotal: MapObservable<string, number>;

    constructor(
        private readonly ko: Knockout,
        private readonly filter: WatchableNotNull<FilterNotNull[]>
    ) {
        const filtermap = ko.computed<Map<string, number>>(() => {
            const filter = this.filter();
            const map = new Map<string, number>();
            filter.forEach((f, index) => map.set(f.name(), index));
            return map;
        });
        this.undefinedNullableService = new UndefinedNullableService();
        const comporatorRows = (keyA: string, keyB: string) => {
            return this.undefinedNullableService.subtract(
                this.resultsTotal.get(keyB),
                this.resultsTotal.get(keyA)
            );
        };
        const comporatorColumns = (keyA: string, keyB: string) => {
            const indexF1 = filtermap().get(keyA);
            const indexF2 = filtermap().get(keyB);
            return indexF1 == null || indexF2 == null ? -1 : indexF1 - indexF2;
        }
        this.resultsTotal = new MapObservable(ko);
        this.map = new MapDoubleKeyObservable(ko);
        this.map.setSortComporatorKey1(comporatorRows);
        this.map.setSortComporatorKey2(comporatorColumns);
        this.map.getPageStateHandler1().setItemsPerPage(ResultTableObservable.NUMBER_OF_LINES_PER_PAGE);
        this.map.getPageStateHandler2().setItemsPerPage(ResultTableObservable.NUMBER_OF_ELEMENTS_PER_LINE);
        this.titlesRow = ko.computed<string[]>(() => this.map.keys1Prepared());
        this.titlesColumn = ko.computed<string[]>(() => this.map.keys2Prepared());
        this.isEmpty = ko.computed<boolean>(() => this.map.isEmpty())
    }

    public clear(): void {
        this.map.clear();
    }

    public addTokens(tokens: TokensTableRow[]): void {
        tokens.forEach(token => {
            const total = token.totalAbs ? token.totalAbs : 0;
            const entries =  token.entries ?  token.entries : [];
            const key1 = (token.label ? token.label : "")
                       + (token.sublabel ? " (" + token.sublabel + ")": "");
            this.resultsTotal.set(key1, total);
            entries.forEach(entry => {
                const key2 = (entry.label ? entry.label : "")
                           + (entry.sublabel ? " ("+ entry.sublabel + ")" : "");
                const value = entry.tokensAbs ? entry.tokensAbs : 0;
                this.map.set(key1, key2, value);
            });
        });
    }

    public getPageStateHandler(): PageStateHandler<string> {
        return this.map.getPageStateHandler1();
    }

    public messageNoResults(): string {
        return "Es konnten keine passenden Ergebnisse gefunden werden.";
    }

    public messageTooMuchResults(): string {
        return "Es wurden so viele Daten geladen, dass es zu Performanceproblemen kommen kann. Es wird empfohlen die Suche einzuschr\u00e4nken. ";
    }

    public messageNotShownAllResults(): string {
        const numberOfResults = this.getPageStateHandler().itemsComplete();
        const numberOfShownResults = this.getPageStateHandler().itemsPerPage();
        return  "Gefunden wurden " + numberOfResults + " Ergebnisse. "
        + "Angezeigt werden " + numberOfShownResults + " Ergebnisse.";
    }
}