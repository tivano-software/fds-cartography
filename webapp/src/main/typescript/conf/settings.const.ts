import { GetTokensTableInnerGroupEnum, GetTokensTableLocationsLevelEnum, GetTokensTableOuterGroupEnum, GetTokensTableTypesLevelEnum } from "../client";
import { SettingsInterface } from "./settings.interface";

// oldRange.max - oldRange.min = 19.
const pieChartDefaultSize = (val: number): number => Math.round(val * 19) / 100;

export const Settings: SettingsInterface = {
    query: {
        defaultInnerGroup: GetTokensTableInnerGroupEnum.TYPES,
        defaultOuterGroup: GetTokensTableOuterGroupEnum.LOCATIONS,
        defaultLocationLevel: GetTokensTableLocationsLevelEnum.MUNICIPALITY,
        defaultTypesLevel: GetTokensTableTypesLevelEnum.GROUPED,
    },
    map: {
        meta: {
            namespace: 'https://fds.germ.unibe.ch/xmls',
        },
        legend: {
            entrySize: 15,
            entryDistanceFactor: 1.2,
            yOffset: 5,
        },
        frames: {
            '4:3': {
                ratio: 75,
                style: 'width: 64vw; height:48vw',
                viewBox: {
                    x: 125,
                    y: 0,
                    width: 640,
                    height: 480
                },
                zoom: 200,
                translate: {
                    x: -4.99499999999999,
                    y: -47.99000000000017,
                },
            },
            '3:2': {
                ratio: 66.6,
                style: 'width: 72vw; height:48vw',
                viewBox: {
                    x: 125,
                    y: 0,
                    width: 720,
                    height: 480,
                },
                zoom: 220,
                translate: {
                    x: -5.039999999999989,
                    y: -47.885000000000176,
                },
            },
            '16:9': {
                ratio: 56.25,
                style: 'width: 85.33vw; height:48vw',
                viewBox: {
                    x: 125,
                    y: 0,
                    width: 853.33,
                    height: 480,
                },
                zoom: 220,
                translate: {
                    x: -4.080000000000002,
                    y: -47.88500000000013,
                },
            }
        },
        pieChart: {
            defaultActivated: true,
            defaultLocationLevel: GetTokensTableLocationsLevelEnum.MUNICIPALITY,
            defaultMode: 'absolut',
            defaultSizeRange: {
                min: pieChartDefaultSize(11),
                max: pieChartDefaultSize(40),
            },
            oldRange: {
                min: 1,
                max: 20,
            }
        },
        areaColoring: {
            defaultActivated: false,
            defaultOpacityRangeMin: 0.4,
            defaultOpacityRangeMax: 0.4,
            defaultLocationLevel: GetTokensTableLocationsLevelEnum.MUNICIPALITY,
            defaultMode: 'absolut',
            oldRange: {
                min: 0,
                max: 1,
            },

        },
        elements: {
            water: {
                riverSize: 35,
                defaultOpacity: 60,
            },
            relief: {
                defaultOpacity: 38,
            },
            cities: {
                showCities: true,
                threshold: 2,
                thresholdRange: {
                    min: 0,
                    max: 9
                }
            }
        },

    },
    general: {
        messaging: {
            'show-duration':  0.1 * 60 * 1000,
        }
    },
    ui: {
        range: {
            min: 0,
            max: 100,
            step: 5
        }
    }
}