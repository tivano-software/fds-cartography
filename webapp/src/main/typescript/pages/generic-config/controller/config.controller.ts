import { Settings } from "../../../conf/settings.const";
import { timeout } from "../../../util/helper/timeout/timeout";
import { Knockout } from "../../../util/knockout";
import { Comporator } from "../../../util/types";
import { ifSet } from "../../../util/types/then-catch/if-set.function";
import { comparator } from "../../../util/helper/list/sort-by";
import { ConfigItemObservable } from "../model/config-item.observable";
import { ConfigType } from "../model/config.enum";
import { ConfigObervable } from "../model/config.observable";
import { ConfigService } from "../services/config.service";
import { CONFIG_MAP_SERVICE } from "../services/config-map.service.const";
import { ExistingConfiguration } from "../../../client";

export class ConfigController<Type extends ConfigType> {

    private criteria: 'id' | 'title' | 'editor' | 'creator' | 'lastEdited' = 'id';
    private orderBy: 'ASC' | 'DESC' = 'DESC';

    public constructor(
        private readonly ko: Knockout,
        private readonly configService: ConfigService<Type>,
        private readonly viewModel: ConfigObervable,

    ) {}

    public search(): void {
        const input = this.viewModel.searchInput();
        this.viewModel.search(ifSet(input).orDefault(''));
    }

    public async initItems(): Promise<void> {
        const itemsPromise = this.configService.findAll();
        const items = await itemsPromise;
        this.viewModel.list.removeAll();
        items.forEach(item => {
            this.viewModel.list.push({
                id: this.ko.observable(item.id),
                title: this.ko.observable(item.title),
                initialAuthor: this.ko.observable(item.initialAuthor),
                lastEditor: this.ko.observable(item.lastEditor),
                createdAt: this.ko.observable(item.createdAt),
                lastEditedAt: this.ko.observable(item.lastEditedAt)
            });
        });
        this.sort(this.criteria, this.orderBy);
    }

    public toggleSort(criteria: 'id' | 'title' | 'editor' | 'creator' | 'lastEdited'): void {
        if (criteria === this.criteria) {
            this.orderBy = this.orderBy === 'ASC' ? 'DESC' : 'ASC';
        } else {
            this.criteria = criteria;
            this.orderBy = 'DESC';
        }
        this.sort(this.criteria, this.orderBy);
    }

    private sort(criteria: 'id' | 'title' | 'editor' | 'creator' | 'lastEdited', orderBy: 'ASC' | 'DESC'): void {
        const comp = ((): Comporator<ConfigItemObservable> => {
            switch(criteria) {
                case 'id': return comparator<number, ConfigItemObservable>('number', orderBy, x => x.id());
                case 'title': return comparator<string, ConfigItemObservable>('string', orderBy, x => x.title());
                case 'editor': return comparator<string, ConfigItemObservable>('string', orderBy, x => x.lastEditor());
                case 'creator': return comparator<string, ConfigItemObservable>('string', orderBy, x => x.initialAuthor());
                case 'lastEdited': return comparator<Date, ConfigItemObservable>('date', orderBy, x => x.lastEditedAt());
            }
        })();
        this.viewModel.list.setSortStrategy(comp);
    }

    public async delete(obj: ConfigItemObservable): Promise<void> {
        const okay = window.confirm("Der Eintrag wird endg\u00fcltig gel\u00f6scht. Sind Sie sicher?");
        if (okay) {
            const promise = this.configService.delete(obj.id()).then(async val => {
                return await this.initItems();
            });
            this.viewModel.getMessagingHandler()
                .registerSuccess(`Der Eintrag wurde erfolgreich gel\u00f6scht`)
                .on('success', promise)
                .until(timeout(Settings.general.messaging["show-duration"]));
            this.viewModel.getMessagingHandler()
                .registerError(`Fehler beim L\u00f6schen des Eintrags.`)
                .on('fail', promise)
                .until(timeout(Settings.general.messaging["show-duration"]));
            return await promise;
        }
    }

    public async copy(obj: ConfigItemObservable): Promise<ExistingConfiguration> {
        const id = obj.id();
        const promise = this.configService.copy(id);
        this.viewModel.getMessagingHandler()
            .registerError(`Fehler beim Kopieren des Eintrags.`)
            .on('fail', promise)
            .until(timeout(Settings.general.messaging["show-duration"]));
        this.viewModel.getMessagingHandler()
            .registerSuccess(`Kopie wurde erfolgreich angelegt`)
            .on('success', promise)
            .until(timeout(Settings.general.messaging["show-duration"]));
         const copy = await promise;
         await this.initItems();
         return copy;
    }
}


export function createConfigControllerMap(ko: Knockout, observable: ConfigObervable): ConfigController<ConfigType.MAP> {
    return new ConfigController(ko, CONFIG_MAP_SERVICE, observable);
}