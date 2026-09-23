import { GetTokensTableLocationsLevelEnum } from "../../../client";
import { Styles } from "../../../conf/styles.const";
import { Knockout, ObservableArray } from "../../../util/knockout";
import { Color } from "../../../util/types/color/color.type";

export class RessourcesObservable {

    public readonly locationLevels: ObservableArray<GetTokensTableLocationsLevelEnum>;
    public readonly colors: ObservableArray<ObservableArray<Color>>;
    // Color[][] = Styles.map.piecharts.rows;

    constructor(readonly ko: Knockout) {
        this.locationLevels = ko.observableArray<GetTokensTableLocationsLevelEnum>([]);
        this.colors = ko.observableArray<ObservableArray<Color>>([]);
    }

    public async init(): Promise<void> {
        Styles.map.piecharts.rows.forEach(rowRaw => {
            const row = this.ko.observableArray<Color>([]);
            rowRaw.forEach(color => row.push(color));
            this.colors.push(row);
        });
        Object.keys(GetTokensTableLocationsLevelEnum).forEach(val => {
            this.locationLevels.push(val as GetTokensTableLocationsLevelEnum);
        });
    }
}