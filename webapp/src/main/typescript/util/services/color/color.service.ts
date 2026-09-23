import { Styles } from "../../../conf/styles.const";
import { Color } from "../../types/color/color.type";

export class ColorService {

    createColors(num: number): Color[] {
        return Styles.map.piecharts.palette;
    }

}