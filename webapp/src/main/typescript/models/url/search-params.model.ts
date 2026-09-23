import { GetTokensTableLocationsLevelEnum } from "../../client";
import { fromStringToEnum, mapNumberListToString, mapStringToNumberList } from "../../util/services/mapper";
import { URLService } from "../../util/services/url-service/url.service";
import { FileNameStringHTML } from "../../util/types/template-types/file-name-string.type";

export interface ConfigDetailDataDetail {
    readonly filterIds: number[];
    readonly locationsLevel: GetTokensTableLocationsLevelEnum;
}

export interface ConfigDetailDataId {
    readonly configId: number;
}

export type ConfigDetailDataModel = ConfigDetailDataDetail | ConfigDetailDataId;


export abstract class SearchParamsModels {

    public static redirectWithParams<Base extends FileNameStringHTML>(
        base: Base,
        filterIds: number[],
        locationsLevel: GetTokensTableLocationsLevelEnum
    ): void {
        const urlService: URLService = new URLService();
        const handler = urlService.createURLParamsByObject<ConfigDetailDataModel>({
            filterIds,
            locationsLevel
        }, {
            filterIds: mapNumberListToString,
            locationsLevel: (val) => val.toString()
        });
        handler.open(base);
    }

    public static extractURLParams(): ConfigDetailDataModel | null {
        const urlService: URLService = new URLService();
        const model = urlService.loadURLParamsByObject<ConfigDetailDataModel>({
            filterIds: (value) => {
                if (!value) {
                    return [];
                }
                return mapStringToNumberList(value);
            },
            locationsLevel: (value) => {
                const enumValue = fromStringToEnum(
                    value as GetTokensTableLocationsLevelEnum,
                    GetTokensTableLocationsLevelEnum
                );
                if (enumValue) {
                    return enumValue;
                }
                throw 'can\'t map location level.';
            },
        });
        if (!model) {
            return urlService.loadURLParamsByObject({
                configId: (value) => {
                    if (value) {
                        return +value;
                    }
                    throw 'can\'t map id.';
                }
            })
        }
        return model;
    }
}