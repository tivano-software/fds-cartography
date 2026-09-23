import { LoadService } from "../../util/services/load/load.service";
import { FileNameStringCSV, InnerPathString } from "../../util/types/template-types/file-name-string.type";
import { DeepReadonly } from "../../util/types/util-types/partial-types/deep-readonly.type";
import { DeepRequired } from "../../util/types/util-types/partial-types/deep-required.type";
import { LocationLevelEnum } from "../locations/location.type";
import { LOCATIONS_MAP } from "../locations/locations-map.const";
import { CityRowCSVEntryFactory } from "./city-row-csv-entry.factory";
import { CityRowCSVEntry } from "./city-row-csv-entry.interface";
import { CityRowFactory } from "./city-row.factory";
import { CityRow } from "./city-row.interface";
import { CityRowRequired } from "./city-row.required.type";

export class CityRowLoadService {

    private static readonly BASE_PATH_CITIES : InnerPathString= 'data/cities/';
    private static readonly FILE_NAME_CITY_LIST: FileNameStringCSV = 'list.csv';

    private readonly loadService = new LoadService();
    private readonly cityRowCSVEntryFactory = new CityRowCSVEntryFactory();
    private readonly cityRowFactory = new CityRowFactory();

    public async loadCities(): Promise<CityRowRequired[]> {
        const cities = await this.loadCityRows();
        const citiesReadonly: CityRowRequired[] = cities.map<CityRowRequired | undefined>((city)  => {
            const geoJSONPos = city.geoJSONPos;
            if (geoJSONPos) {
                return { ...city, geoJSONPos };
            }
            return undefined;
        }).filter(val => val !== undefined).map<CityRowRequired>(val => val as CityRowRequired);
        return citiesReadonly;
    }

    private readonly loadCityRows = async (): Promise<CityRow[]> => {
        const rows = await this.loadCSVRows();
        const map = await LOCATIONS_MAP.getMap(LocationLevelEnum.MUNICIPALITY, 'point');
        return rows.map(row => this.cityRowFactory.create(row, map)).filter(row => row && row.geoJSONPos);
    }

    private readonly loadCSVRows = async (): Promise<(CityRowCSVEntry)[]> => {
        const rows = await this.loadCSVRowsAsStringArray();
        return rows
            .map((row): (CityRowCSVEntry | undefined) => this.cityRowCSVEntryFactory.create(row))
            .filter(row => row !== undefined)
            .map(row => row as CityRowCSVEntry);
    }

    private readonly loadCSVRowsAsStringArray = async (): Promise<string[][]> => this.loadService.loadCSVByBase(CityRowLoadService.BASE_PATH_CITIES, CityRowLoadService.FILE_NAME_CITY_LIST, ';');

}