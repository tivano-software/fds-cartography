import { URLService } from "../../util/services/url-service/url.service";
import { FileNameStringHTML } from "../../util/types/template-types/file-name-string.type";

export enum MapSortByEnum {
    ID = 'ID',
    Name = 'Name'
}
export interface MapConfigModel {
    readonly sortBy: MapSortByEnum;
    readonly orderBy: 'ASC' | 'DESC';
    readonly page: number;
}

export abstract class MapConfigModels {

    public static updatePageURL<Base extends FileNameStringHTML>(
        base: Base,
        page: number,
    ): void {
        const urlService = new URLService();
        urlService.updateURLParamsByObject<MapConfigModel, 'page'>(base, {
            page
        }, {
            sortBy: (value) => {
                if (value === 'ID') {
                    return MapSortByEnum.ID;
                }
                if (value === 'Name') {
                    return MapSortByEnum.Name;
                }
                throw 'can\'t map sortBy.';
            },
            orderBy: (value) => {
                if (value === 'ASC' || value === 'DESC') {
                    return value;
                }
                throw 'can\'t map orderBy.';
            },
            page: (value) => {
                if (value === undefined || value === null) {
                    throw `can't map page.`;
                }
                return +value;
            }
        }, {
            sortBy: (val) => val.toString(),
            orderBy: (val) => val.toString(),
            page: (val) => val + "",
        })
    }

    public static redirectWithParams<Base extends FileNameStringHTML>(
        base: Base,
        sortBy: MapSortByEnum,
        orderBy: 'ASC' | 'DESC',
        page: number,
    ): void {
        const urlService = new URLService();
        const handler = urlService.createURLParamsByObject<MapConfigModel>({
            sortBy,
            orderBy,
            page
        }, {
            sortBy: (val) => val.toString(),
            orderBy: (val) => val.toString(),
            page: (val) => val + "",
        });
        handler.open(base);
    }

    public static extractURLParams(): MapConfigModel | null {
        const urlService: URLService = new URLService();
        const model = urlService.loadURLParamsByObject<MapConfigModel>({
            sortBy: (value) => {
                if (value === 'ID') {
                    return MapSortByEnum.ID;
                }
                if (value === 'Name') {
                    return MapSortByEnum.Name;
                }
                throw 'can\'t map sortBy.';
            },
            orderBy: (value) => {
                if (value === 'ASC' || value === 'DESC') {
                    return value;
                }
                throw 'can\'t map orderBy.';
            },
            page: (value) => {
                if (value === undefined || value === null) {
                    throw `can't map page.`;
                }
                return +value;
            }
        });
        return model;
    }
}
