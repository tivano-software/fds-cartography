import { Settings } from "../../../conf/settings.const";
import { LocationLevel } from "../../../models/locations/location.type";
import { Color } from "../../../util/types/color/color.type";
import { DataRepresentationMode } from "../../filter-results-map/view-models/settings/svg-setting.observable";

export enum ConfigType {
    QUERY = 'QUERY',
    MAP = 'MAP'
}

/**
 * Bitte entferne keine Felder!
 * Wir lesen dieses Objekt generisch aus der Datenbank.
 */
export interface ConfigFilter {
    customName: string;
    id: number;
    colorPieChart: Color;
    colorAreaColoring: Color;
    areaColoringActive?: boolean;
    pieChartActive?: boolean;
}

export interface ConfigSettings {
    locationLevel: LocationLevel;
    mode: DataRepresentationMode;
    isRelative: boolean;
    isAbsolute?: boolean;
    isActive: boolean;
    isDistribution?: boolean;
    range: {
        max: number;
        min: number;
    };
}

export interface ConfigGeneralMapSettings {
    showLegend: boolean;
    showBorder: boolean;
    showCantonBorders: boolean;
    showCantonNames: boolean;
    backgroundOpacity: number;
    riverSize: number;
    cities: {
        readonly showCities: boolean;
        readonly threshold: number;
    };
    zoom: number;
    position: {
        x: number;
        y: number;
    };
    format: keyof (typeof Settings.map.frames);
}

export type ConfigDef<Type extends ConfigType> =
    Type extends ConfigType.QUERY ? {

    } :
    Type extends ConfigType.MAP ? {
        filters: ConfigFilter[],
        pieChart: ConfigSettings,
        areaColoring: ConfigSettings,
        generalSettings: ConfigGeneralMapSettings
    } :
    never;
