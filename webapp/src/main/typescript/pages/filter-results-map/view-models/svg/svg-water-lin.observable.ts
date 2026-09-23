import { Knockout } from "../../../../util/knockout";
import { Feature, WaterPropertiesLin } from "../../../../util/services/geojson/geojson-load.service";
import { SVGWaterObservable } from "./svg-water.observable";
import { SVGSettingObservable } from "../settings/svg-setting.observable";
import { Styles } from "../../../../conf/styles.const";
import { FileNameStringJSON } from "../../../../util/types/template-types/file-name-string.type";

export class SVGWaterLinObservable extends SVGWaterObservable<'water-lin', WaterPropertiesLin> {
    constructor(
        readonly ko: Knockout,
        protected readonly ressource: FileNameStringJSON,
        protected readonly settings: SVGSettingObservable
    ) {
        super(ko, ressource, settings, 'water-lin', {}, (feature: Feature<WaterPropertiesLin>) => {
            const lb = 40 - this.settings.cardElements.riverSize();
            const lbMod = 0.25 * lb / 40
            const isOberirdisch =
                feature.properties.VERLAUF &&
                feature.properties.VERLAUF.match("oberirdisch");
            const isBigEnough = feature.properties.LB >= lbMod;
            return {
                display: !!(isOberirdisch && isBigEnough),
                "stroke-width": Styles.map.water["stroke-width"](feature.properties.LB),
                "stroke-linejoin": "round",
                "stroke": Styles.map.water.color,
                "fill": 'none'
            };
        });
    }
}