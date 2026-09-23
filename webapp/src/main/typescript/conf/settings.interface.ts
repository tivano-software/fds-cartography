import { GetTokensTableInnerGroupEnum, GetTokensTableOuterGroupEnum, GetTokensTableTypesLevelEnum } from "../client";
import { LocationLevel } from "../models/locations/location.type";
import { DataRepresentationMode } from "../pages/filter-results-map/view-models/settings/svg-setting.observable";
import { URLPrefixString } from "../util/types/template-types/file-name-string.type";

interface MapFrame {
    ratio: number;
    style: string;
    viewBox: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    zoom: number;
    translate: {
        x: number;
        y: number;
    }
}

export interface SettingsInterface {
    readonly query: {
        readonly defaultInnerGroup: GetTokensTableInnerGroupEnum;
        readonly defaultOuterGroup: GetTokensTableOuterGroupEnum;
        readonly defaultLocationLevel: LocationLevel;
        readonly defaultTypesLevel: GetTokensTableTypesLevelEnum;
    };
    readonly map: {
        readonly meta: {
            readonly namespace: URLPrefixString;
        }
        readonly frames: {
            '3:2': MapFrame;
            '4:3': MapFrame;
            '16:9': MapFrame;
        };
        readonly legend: {
            readonly entrySize: number;
            readonly entryDistanceFactor: number;
            readonly yOffset: number;
        }
        readonly pieChart: {
            readonly defaultActivated: boolean;
            readonly defaultLocationLevel: LocationLevel,
            readonly defaultMode: DataRepresentationMode,
            readonly defaultSizeRange: {
                readonly min: number,
                readonly max: number,
            }
            readonly oldRange: {
                readonly min: number,
                readonly max: number,
            }
        };
        readonly areaColoring: {
            readonly defaultActivated: boolean;
            readonly defaultOpacityRangeMin: number;
            readonly defaultOpacityRangeMax: number;
            readonly defaultLocationLevel: LocationLevel,
            readonly defaultMode: DataRepresentationMode,
            readonly oldRange: {
                readonly min: number,
                readonly max: number,
            },
        };
        readonly elements: {
            readonly water: {
                readonly riverSize: 0 | 10 | 20 | 30 | 35 | 40 | 50 | 60;
                readonly defaultOpacity: number;
            };
            readonly relief: {
                readonly defaultOpacity: number;
            };
            readonly cities: {
                readonly showCities: boolean;
                readonly threshold: number;
                readonly thresholdRange: {
                    readonly min: number;
                    readonly max: number;
                };
            };
        };
    };
    readonly general: {
        readonly messaging: {
            readonly 'show-duration': number;
        }
    };
    readonly ui: {
        readonly range: {
            readonly min: number,
            readonly max: number,
            readonly step: number,
        }
    };
}