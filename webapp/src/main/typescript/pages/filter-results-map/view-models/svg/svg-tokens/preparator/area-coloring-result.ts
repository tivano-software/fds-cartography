import { MaxCalculator } from "../../../../../../util/helper/updater/max-calculator";
import { XML } from "../../../../../../util/services/xml-tag-service";

export interface AreaColoringResult {
    readonly areaColoringFactories: ((val: number) => XML<'g'>)[],
    readonly maxOfTotal: MaxCalculator
}