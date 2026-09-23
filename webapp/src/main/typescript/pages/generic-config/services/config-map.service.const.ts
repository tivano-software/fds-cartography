import { ConfigType } from "../model/config.enum";
import { ConfigService } from "./config.service";

export const CONFIG_MAP_SERVICE = new ConfigService<ConfigType.MAP>(ConfigType.MAP);