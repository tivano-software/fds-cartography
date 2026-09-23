import { FilterPredicate, FilterPredicateGeneric, MatchAll, MatchAny, MatchLayer, MatchNamingMotive, MatchLanguageCategory, MatchLocation, MatchNot, MatchSameTypeAs, MatchSameLocationAs, MatchTypesRegexp, MatchTypesDescriptionRegexp } from "../../../client";
import { MatchSchema } from "../observable/helper/match-schema.enum";
import { createMatchAllOf, createMatchAnyOf, MatchChildsObservable } from "../observable/components/match-childs.observable";
import { createMatchLayer, MatchLayerObservable } from "../observable/components/match-layer.observable";
import { createMatchNamingMotive, MatchNamingMotiveObservable } from "../observable/components/match-naming-motive.observable";
import { createMatchLanguageCategory, MatchLanguageCategoryObservable } from "../observable/components/match-language-category.observable";
import { createMatchLocation, MatchLocationObservable } from "../observable/components/match-location.observable";
import { createNestedFilter, MatchNestedFilterObservable } from "../observable/components/match-nested-filter.observable";
import { createMatchTypesRegex, MatchTypesRegexObservable } from "../observable/components/match-types-regex.observable";
import { createMatchTypesDescriptionRegex, MatchTypesDescriptionRegexObservable } from "../observable/components/match-types-description.observable";
import { MatchAbstractObservable } from "../observable/components/match-abstract.observable";
import { Knockout } from "../../../util/knockout";



export interface MapFilterServiceInterface  {
    mapApiToLocal(filter: FilterPredicate | undefined, ko: Knockout):  MatchAbstractObservable | undefined;
    mapLocalToApi(filter:  MatchAbstractObservable | undefined): FilterPredicate | undefined;

}

export type FilterOperation = 'MatchAll' | 'MatchAny' | 'MatchLayer' | 'MatchLocation' | 'MatchNot' | 'MatchSameLocationAs' | 'MatchSameTypeAs' | 'MatchTypesRegexp';

export class MapFilterService implements MapFilterServiceInterface {

    mapApiToLocal(filter: FilterPredicate | undefined | FilterPredicateGeneric, ko: Knockout): MatchAbstractObservable | undefined {
        if (filter === undefined) {
            return undefined;
        }
        switch(filter.operation) {
            case 'MatchAll': return this.mapApiToLocalMatchAll(filter as MatchAll, ko);
            case 'MatchAny': return this.mapApiToLocalMatchAny(filter as MatchAny, ko);
            case 'MatchLayer': return this.mapApiToLocalMatchLayer(filter as MatchLayer, ko);
            case 'MatchLocation': return this.mapApiToLocalMatchLocation(filter as MatchLocation, ko);
            case 'MatchSameLocationAs': return this.mapApiToLocalNestedFilter(filter as MatchSameLocationAs, ko);
            case 'MatchSameTypeAs': return this.mapApiToLocalNestedFilter(filter as MatchSameTypeAs, ko);
            case 'MatchNot': return this.mapApiToLocalNestedFilter(filter as MatchNot, ko);
            case 'MatchTypesRegexp': return this.mapApiToLocalMatchRegex(filter as MatchTypesRegexp, ko);
            case 'MatchTypesDescriptionRegexp': return this.mapApiToLocalMatchTypesDescriptionRegex(filter as MatchTypesDescriptionRegexp, ko);
            case 'MatchNamingMotive': return this.mapApiToLocalMatchNamingMotive(filter as MatchNamingMotive, ko);
            case 'MatchLanguageCategory': return this.mapApiToLocalMatchLanguageCategory(filter as MatchLanguageCategory, ko);
            default:
                throw filter.operation + ' no mapping defined.';
        }
    }

    mapApiToLocalMatchAll(filter: MatchAll, ko: Knockout): MatchChildsObservable {
        const observableAllOf = createMatchAllOf(ko);
        if (filter.filters) {
            filter.filters.forEach(child => {
                const observableChild = this.mapApiToLocal(child, ko);
                if (observableChild !== undefined) {
                    observableAllOf.add(observableChild);
                }
            });
        }
        return observableAllOf;
    }

    mapApiToLocalMatchAny(filter: MatchAny, ko: Knockout): MatchChildsObservable {
        const observableAnyOf = createMatchAnyOf(ko);
        if (filter.filters) {
            filter.filters.forEach(child => {
                const observableChild = this.mapApiToLocal(child, ko);
                if (observableChild !== undefined) {
                    observableAnyOf.add(observableChild);
                }
            });
        }
        return observableAnyOf;
    }

    mapApiToLocalMatchLayer(filter: MatchLayer, ko: Knockout): MatchLayerObservable {
        const observableLayer = createMatchLayer(ko);
        if (filter.layer) {
            observableLayer.setLayer(filter.layer);
        }
        return observableLayer;
    }

    mapApiToLocalMatchNamingMotive(filter: MatchNamingMotive, ko: Knockout): MatchNamingMotiveObservable {
        const observableLayer = createMatchNamingMotive(ko);
        if (filter.namingMotive) {
            observableLayer.setNamingMotive(filter.namingMotive);
        }
        return observableLayer;
    }

    mapApiToLocalMatchLanguageCategory(filter: MatchLanguageCategory, ko: Knockout): MatchLanguageCategoryObservable {
        const observableLayer = createMatchLanguageCategory(ko);
        if (filter.languageCategory) {
            observableLayer.setLanguageCategory(filter.languageCategory);
        }
        return observableLayer;
    }

    mapApiToLocalMatchLocation(filter: MatchLocation, ko: Knockout): MatchLocationObservable {
        const observableLocation = createMatchLocation(ko);
        if (filter.field && filter.match) {
            observableLocation.setField(filter.field);
            observableLocation.setMatch(filter.match);
        }
        return observableLocation;
    }

    mapApiToLocalNestedFilter(filter: MatchNot | MatchSameLocationAs | MatchSameTypeAs, ko: Knockout): MatchNestedFilterObservable {
        const observableNestedFilter = createNestedFilter(ko, MatchSchema[filter.operation as keyof typeof MatchSchema]);
        if (filter.filter !== undefined) {
            observableNestedFilter.setFilter(this.mapApiToLocal(filter.filter, ko) as MatchAbstractObservable);
        }
        return observableNestedFilter;
    }

    mapApiToLocalMatchRegex(filter: MatchTypesRegexp, ko: Knockout): MatchTypesRegexObservable {
        const observableRegex = createMatchTypesRegex(ko);
        if (filter.regexp) {
            observableRegex.setRegex(filter.regexp);
        }
        return observableRegex;
    }

    mapApiToLocalMatchTypesDescriptionRegex(filter: MatchTypesDescriptionRegexp, ko: Knockout): MatchTypesDescriptionRegexObservable {
        const observableRegex = createMatchTypesDescriptionRegex(ko);
        if (filter.regexp) {
            observableRegex.setRegex(filter.regexp);
        }
        return observableRegex;
    }

    mapLocalToApi(filter: MatchAbstractObservable | undefined): FilterPredicate {
        if (filter === undefined) {
            throw new Error('filter should not be undefined.');
        }
        switch(filter.getMatchSchema()) {
            case MatchSchema.MatchAll: return this.mapLocalToApiMatchAll(filter as MatchChildsObservable);
            case MatchSchema.MatchAny: return this.mapLocalToApiMatchAny(filter as MatchChildsObservable);
            case MatchSchema.MatchLayer: return this.mapLocalToApiLayer(filter as MatchLayerObservable);
            case MatchSchema.MatchNamingMotive: return this.mapLocalToApiNamingMotive(filter as MatchNamingMotiveObservable);
            case MatchSchema.MatchLanguageCategory: return this.mapLocalToApiLanguageCategory(filter as MatchLanguageCategoryObservable);
            case MatchSchema.MatchLocation: return this.mapLocalToApiLocation(filter as MatchLocationObservable);
            case MatchSchema.MatchNot: return this.mapLocalToApiNot(filter as MatchNestedFilterObservable);
            case MatchSchema.MatchSameLocationAs: return this.mapLocalToApiSameLocationAs(filter as MatchNestedFilterObservable);
            case MatchSchema.MatchSameTypeAs: return this.mapLocalToApiSameTypeAs(filter as MatchNestedFilterObservable);
            case MatchSchema.MatchTypesRegex: return this.mapLocalToApiRegex(filter as MatchTypesRegexObservable);
            case MatchSchema.MatchTypesDescriptionRegex: return this.mapLocalToApiTypesDescriptionRegex(filter as MatchTypesDescriptionRegexObservable);
            default: throw new Error(filter.getMatchSchema() + " is not defined.");
        }
    }

    mapLocalToApiRegex(filter: MatchTypesRegexObservable): { operation: 'MatchTypesRegexp' } & MatchTypesRegexp {
        return {
            operation: 'MatchTypesRegexp',
            regexp: filter.getRegex()
        };
    }

    mapLocalToApiTypesDescriptionRegex(filter: MatchTypesDescriptionRegexObservable): { operation: 'MatchTypesDescriptionRegexp' } & MatchTypesDescriptionRegexp {
        return {
            operation: 'MatchTypesDescriptionRegexp',
            regexp: filter.getRegex()
        };
    }

    mapLocalToApiLocation(filter: MatchLocationObservable): { operation: 'MatchLocation' } & MatchLocation {
        return {
            operation: 'MatchLocation',
            field: filter.getField(),
            match: filter.getMatch()
        };
    }

    mapLocalToApiLayer(filter: MatchLayerObservable): { operation: 'MatchLayer' } & MatchLayer {
        return {
            operation: 'MatchLayer',
            layer: filter.getLayer()
        };
    }

    mapLocalToApiNamingMotive(filter: MatchNamingMotiveObservable): { operation: 'MatchNamingMotive' } & MatchNamingMotive {
        return {
            operation: 'MatchNamingMotive',
            namingMotive: filter.getNamingMotive()
        };
    }
    mapLocalToApiLanguageCategory(filter: MatchLanguageCategoryObservable): { operation: 'MatchLanguageCategory' } & MatchLanguageCategory {
        return {
            operation: 'MatchLanguageCategory',
            languageCategory: filter.getLanguageCategory()
        };
    }

    mapLocalToApiNot(filter: MatchNestedFilterObservable):  { operation: 'MatchNot' } & MatchNot {
        return {
            filter: this.mapLocalToApi(filter.getFilter()),
            operation: 'MatchNot'
        }
    }

    mapLocalToApiSameLocationAs(filter: MatchNestedFilterObservable):  { operation: 'MatchSameLocationAs' } & MatchSameLocationAs {
        return {
            filter: this.mapLocalToApi(filter.getFilter()),
            operation: 'MatchSameLocationAs'
        }
    }

    mapLocalToApiSameTypeAs(filter: MatchNestedFilterObservable):  { operation: 'MatchSameTypeAs' } & MatchSameTypeAs {
        return {
            filter: this.mapLocalToApi(filter.getFilter()),
            operation: 'MatchSameTypeAs'
        }
    }
    mapLocalToApiMatchAll(filter: MatchChildsObservable): { operation: 'MatchAll' } & MatchAll {
        return {
            filters: filter.getMatchables().map(child => this.mapLocalToApi(child)),
            operation: 'MatchAll'
        };
    }

    mapLocalToApiMatchAny(filter: MatchChildsObservable): { operation: 'MatchAny' } & MatchAny {
        return {
            filters: filter.getMatchables().map(child => this.mapLocalToApi(child)),
            operation: 'MatchAny'
        };
    }

}