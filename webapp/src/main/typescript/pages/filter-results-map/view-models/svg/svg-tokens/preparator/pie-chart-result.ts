import { MaxCalculator } from "../../../../../../util/helper/updater/max-calculator";
import { XML } from "../../../../../../util/services/xml-tag-service";

export interface PieChartResult {
    readonly useList: XML<'use'>[],
    readonly symbolMap: Map<string, (size: number) => XML<"symbol">>,
    readonly maxOfTotal: MaxCalculator
}