import { ConfigType } from "../model/config.enum";
import { ConfigService } from "./config.service";

export const CONFIG_QUERY_SERVICE = new ConfigService<ConfigType.QUERY>(ConfigType.QUERY);
