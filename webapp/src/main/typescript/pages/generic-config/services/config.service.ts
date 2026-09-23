import { ConfigApi, ExistingConfiguration, ModelConfiguration } from "../../../client";
import { API_CONFIG } from "../../../conf/api.const";
import { CopyNameCreator } from "../../../util/helper/copy/copy-name-creator";
import { DeepPartial } from "../../../util/types/util-types/partial-types/deep-partial.type";
import { ConfigDef, ConfigType } from "../model/config.enum";
import { PartialConfigData } from "./config-data";
import { ConfigDataMapper } from "./config-data-mapper";
import { ListConfig } from "./list-config.interface";


export class ConfigService<Type extends ConfigType> {

    private readonly configApi = new ConfigApi(API_CONFIG);
    private readonly mapper = new ConfigDataMapper();
    private readonly copyNameCreator = new CopyNameCreator();

    constructor(private readonly type: Type) {}

    public async findAll(): Promise<ListConfig<Type>[]> {
        const promise = this.configApi.configurationsForType({
            type: this.type
        });
        const data = await promise;
        const jsons = data.map<ListConfig<Type>>(date => this.mapper.toListConfig(date));
        return jsons;
    }

    public async findOneById(id: number): Promise<PartialConfigData<Type>> {
        const config = await this.configApi.getConfigByTypeAndId({
            type: this.type,
            id
        });
        const json: DeepPartial<ConfigDef<Type>> = this.mapper.parseJSON(config.data);
        return {
            json,
            name: config.name
        };
    }

    public async createOrUpdate(values: PartialConfigData<Type>, id?: number): Promise<ExistingConfiguration> {
        if (id) {
            return this.update(values, id)
        } else {
            return this.create(values);
        }
    }

    public async create(values: PartialConfigData<Type>): Promise<ExistingConfiguration> {
        const modelConfiguration = this.mapper.toModelConfiguration(this.type, values);
        return this.configApi.createConfiguration({ modelConfiguration });
    }

    public async update(values: PartialConfigData<Type>, id: number): Promise<ExistingConfiguration> {
        const modelConfiguration = this.mapper.toModelConfiguration(this.type, values);
        return this.updateRaw(modelConfiguration, id);
    }

    public async updateRaw(modelConfiguration: ModelConfiguration, id: number): Promise<ExistingConfiguration> {
        return this.configApi.updateConfig({
            id: id,
            type: this.type,
            modelConfiguration
        });
    }

    public async delete(id: number): Promise<void> {
        return await this.configApi.deleteConfig({
            id,
            type: this.type
        });
    }

    public async copy(id: number): Promise<ExistingConfiguration> {
        const configStored = await this.findOneById(id);
        configStored.name = this.copyNameCreator.createNewName(configStored.name ?? "");
        const configNew: ExistingConfiguration = await this.create(configStored);
        return configNew;
    }

}