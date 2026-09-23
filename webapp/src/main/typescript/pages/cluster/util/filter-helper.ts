import { ExistingNamedFilter, FilterPredicate, NamedFilter } from "../../../client";
import { LocationLevel } from "../../../models/locations/location.type";


export class FilterHelper {

    public createNamedfilter(name: string, description: string, filter: FilterPredicate): NamedFilter {
        return {
            name,
            editable: true,
            description,
            filter
        };
    }

    public toMatchLocation(match: string, field: LocationLevel): FilterPredicate {
        return {
            operation: "MatchLocation",
            match: match,
            field: field,
        } as FilterPredicate;
    }

    public toOnePredicate(predicates: FilterPredicate[], operation: "MatchAll" | "MatchAny"): FilterPredicate {
        if (predicates.length == 1) {
            return predicates[0];
        }
        return { operation, filters: predicates };
    }

    public toPredicates(filters: (ExistingNamedFilter | NamedFilter)[]): FilterPredicate[] {
        const predicates = filters
            .map(f => f.filter)
            .filter(f => f !== undefined)
            .map(f => f as FilterPredicate);
        return predicates;
    }

}