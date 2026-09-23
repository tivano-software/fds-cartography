import { DeepPartial } from "../../../util/types/util-types/partial-types/deep-partial.type";
import { ConfigDef, ConfigType } from "../model/config.enum";

export interface ListConfig<Type  extends ConfigType> {
    data: DeepPartial<ConfigDef<Type>>;
    id: number,
    title: string,
    initialAuthor: string,
    lastEditor: string,
    createdAt: Date | undefined;
    lastEditedAt: Date | undefined;
}