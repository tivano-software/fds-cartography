import { ExistingNamedFilter, FiltersApi } from "../../../client";
import { ConfigFilter } from "../../../pages/generic-config/model/config.enum";
import { DeepPartial } from "../../types/util-types/partial-types/deep-partial.type";

export class FiltersAPIService extends FiltersApi {

    async extendFilters(filters: DeepPartial<ConfigFilter>[]): Promise<(ExistingNamedFilter & Partial<ConfigFilter>)[]> {
        const results = [];
        const failedIds = [];
        for (const filter of filters) {
            try {
                if (!filter.id) {
                    continue;
                }
                const promise = this.getFilterByID({ id: filter.id });
                const result = await promise;
                results.push(Object.assign(result, filter));
            } catch(exception) {
                failedIds.push(filter.id);
            }
        }
        if (failedIds.length > 0) {
            throw `Can't load filters with the id in ${failedIds}.`;
        }
        return results;
    }

    async findByIdList(ids: number[]): Promise<ExistingNamedFilter[]> {
        const results = [];
        const failedIds = [];
        for (const id of ids) {
            try {
                const promise = this.getFilterByID({id});
                const result = await promise;
                results.push(result);
            } catch(exception) {
                failedIds.push(id);
            }
        }
        if (failedIds.length > 0) {
            throw `Can't load filters with the id in ${failedIds}.`;
        }
        return results;
    }

}