import { iteratorToList } from "../helper/list/iterator-to-list.function";
import { permutations } from "../helper/list/permutation.function";
import { Predicate } from "../validation/predicate.interface";

export class SearchService {
    private static readonly REGEX_TERM: RegExp = /^([a-z]*):(.*)$/;
    private static readonly TERM_LIST: RegExp = /.*(:|;).*/;

    public createFilterPredicate<A>(search: string | undefined | null, getterMap: Map<string, ((a: A) => string)>): Predicate<A> {
        if (!search) {
            return () => true;
        }
        if (search.match(SearchService.TERM_LIST)) {
            return this.createKeyWordPredicate(search, getterMap);
        } else {
            const getters = iteratorToList(getterMap.values());
            return this.createSimpleFilterPredicate<A>(search, getters);
        }
    }

    private createKeyWordPredicate<A>(search: string, getterMap: Map<string, ((a: A) => string)>): Predicate<A> {
        const terms = search.split(';').map(term => term.trim());
        const termPredicate = (term: string): Predicate<A> => (a: A): boolean => {
            const regexResult = SearchService.REGEX_TERM.exec(term);
            if (regexResult) {
                const key = regexResult[1];
                const getter = getterMap.get(key);
                if (getter) {
                    const valueToSearch = this.createPreparedSearchString(regexResult[2]);
                    const valueInObj = this.createCompareStrings(getter(a));
                    return valueInObj.match(valueToSearch) !== null;
                }
            }
            const simplePred = this.createSimpleFilterPredicate(term, iteratorToList(getterMap.values()));
            return simplePred(a);

        };
        const [aggregator, init]: [(x: boolean, y: boolean) => boolean, boolean] = [(x, y) => x && y, true];
        return (a: A): boolean => terms
            .map<Predicate<A>>(term => termPredicate(term))
            .map<boolean>(predicate => predicate(a))
            .reduce<boolean>(aggregator, init);
    }

    private createSimpleFilterPredicate<A>(search: string, getters: ((a: A) => string)[]): Predicate<A> {
        const preparedSearchString = this.createPreparedSearchString(search);
        return (a: A): boolean => {
            const vals = getters.map(getter => getter(a));
            const compareStrings: string[] = permutations(vals).map(val => val.join(' '));
            for (const compareString of compareStrings) {
                if (this.createCompareStrings(compareString).match(preparedSearchString)) {
                    return true;
                }
            }
            return false;
        };
    }

    private readonly createPreparedSearchString = (search: string): string => this.createCompareStrings(search).split(' ').join('.*');
    private readonly createCompareStrings = (s: string): string => s.toLowerCase();
}
