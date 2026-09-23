import { Knockout } from "../../../../util/knockout";
import { RiverProperties } from "../../../../util/services/geojson/geojson-load.service";
import { SVGWaterObservable } from "./svg-water.observable";
import { SVGSettingObservable } from "../settings/svg-setting.observable";
import { Styles } from "../../../../conf/styles.const";
import { Settings } from "../../../../conf/settings.const";
import { FileNameStringJSON } from "../../../../util/types/template-types/file-name-string.type";

export class SVGWaterPolyObservable extends SVGWaterObservable<'water-poly', RiverProperties> {
    constructor(
        readonly ko: Knockout,
        protected readonly ressource: FileNameStringJSON,
        protected readonly settings: SVGSettingObservable
    ) {
        super(ko, ressource, settings, 'water-poly', {}, () => {
            return {
                'fill': Styles.map.water.color,
                'fill-opacity': Settings.map.elements.water.defaultOpacity,
                'stroke-opacity': Settings.map.elements.water.defaultOpacity
            };
        });
    }

}