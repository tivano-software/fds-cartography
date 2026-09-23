import { ExistingConfiguration, ModelConfiguration } from "../../../client";
import { DeepPartial } from "../../../util/types/util-types/partial-types/deep-partial.type";
import { ConfigDef, ConfigType } from "../model/config.enum";
import { PartialConfigData } from "./config-data";
import { ListConfig } from "./list-config.interface";

export class ConfigDataMapper {

    public toListConfig<Type extends ConfigType>(date: ExistingConfiguration): ListConfig<Type> {
        const data: DeepPartial<ConfigDef<Type>> = this.parseJSON(date.data);
        const config:  ListConfig<Type> = {
            data,
            id: date.id ? date.id : -1,
            title: date.name ? date.name : '',
            initialAuthor: date.initialAuthor && date.initialAuthor.email ? date.initialAuthor.email : '',
            lastEditor: date.lastEditor && date.lastEditor.email ? date.lastEditor.email : '',
            createdAt: date.createdAt,
            lastEditedAt: date.lastEditedAt,
        };
        return config;
    }

    public toModelConfiguration<Type extends ConfigType>(type: Type, values: PartialConfigData<Type>): ModelConfiguration {
        const data: object = this.stringifyJSON(values.json) as unknown as object;
        const modelConfiguration: ModelConfiguration = {
            data: data,
            type: type,
            name: values.name
        };
        return modelConfiguration;
    }

    public parseJSON<Type extends ConfigType>(data: string | object | undefined): DeepPartial<ConfigDef<Type>> {
        return data ? JSON.parse(data as string) : {};
    }

    public stringifyJSON<Type extends ConfigType>(data: Partial<ConfigDef<Type>>): string {
        return JSON.stringify(data);
    }

}