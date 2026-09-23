import { DeepPartial } from "../../../util/types/util-types/partial-types/deep-partial.type";
import { ConfigDef, ConfigType } from "../model/config.enum";

export interface PartialConfigData<Type extends ConfigType> {
    json: DeepPartial<ConfigDef<Type>>,
    name?: string
}