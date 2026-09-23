import { ifSet } from "../../util/types/then-catch/if-set.function";
import { CityRowCSVEntry } from "./city-row-csv-entry.interface";

export class CityRowCSVEntryFactory {

    private static readonly NUMBER_OF_COLUMNS = 8;
    private static readonly INDEX_OF_NAME = 1;
    private static readonly INDEX_OF_RANK = 5;
    private static readonly INDEX_OF_DISPLAY_LEVEL = 6;

    public readonly isMappingPossible = (row: string[]): boolean =>
        row.length >= CityRowCSVEntryFactory.NUMBER_OF_COLUMNS &&
        ifSet(row[CityRowCSVEntryFactory.INDEX_OF_NAME]).eval() &&
        ifSet(row[CityRowCSVEntryFactory.INDEX_OF_RANK]).eval() &&
        isFinite(Number(row[CityRowCSVEntryFactory.INDEX_OF_RANK])) &&
        ifSet(this.readNumberBut0(row, CityRowCSVEntryFactory.INDEX_OF_DISPLAY_LEVEL)).eval() &&
        isFinite(Number(row[CityRowCSVEntryFactory.INDEX_OF_DISPLAY_LEVEL]));

    public readonly create = (row: string[]): CityRowCSVEntry | undefined => this.isMappingPossible(row) ? ({
        code: Number(row[0]),
        name: row[CityRowCSVEntryFactory.INDEX_OF_NAME],
        cantonFormel: row[2],
        cantonCleanText: row[3],
        population: Number(row[4]),
        rank: this.readNumber(row, CityRowCSVEntryFactory.INDEX_OF_RANK),
        displayLevel: this.readNumber(row, CityRowCSVEntryFactory.INDEX_OF_DISPLAY_LEVEL),
        ratio: row[7]
    }) : undefined;

    private readonly readNumberBut0 = (row: string[], index: number): number | undefined => ((val: number) => val === 0 ? undefined : val)(this.readNumber(row, index));

    private readonly readNumber = (row: string[], index: number): number => Number(row[index])

}