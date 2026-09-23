

export type Predicate<A> = (a: A) => boolean;

export interface MessagedPredicate<A> {
    predicate: Predicate<A | undefined>;
    message: string;
}


export class MessagedPredicates {
    public static NOT_UNDEFINED<A>(name: string): MessagedPredicate<A>{
        return {
            predicate: a => a !== undefined,
            message: name + ' darf nicht leer sein.'
        };
    }

    public static NOT_EMPTY_STRING<A>(name: string): MessagedPredicate<string>{
        return {
            predicate: a => a !== '',
            message: name + ' darf nicht leer sein.'
        };
    }
}