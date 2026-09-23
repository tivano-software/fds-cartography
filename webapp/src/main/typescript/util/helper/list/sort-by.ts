import { UndefinedNullableService } from "../../services/undefined-nullable.service";
import { Comporator } from "../../types";

export function sortFactor(orderBy: 'ASC' | 'DESC'): -1 | 1 {
    return orderBy === 'ASC' ? 1 : -1;
}

export type StringTypeMapped = string | number | Date;

export type StringType<Value extends StringTypeMapped> =
    Value extends string ? 'string' :
    Value extends number ? 'number' :
    Value extends Date ? 'date' :
    never;

export function primitivComparator<Value extends StringTypeMapped>(type: StringType<Value>, orderBy: 'ASC' | 'DESC'): Comporator<Value | undefined | null> {
    const undefinedNullableService = new UndefinedNullableService();
    switch(type) {
        case 'string': return (a: Value | undefined | null, b: Value | undefined | null) => sortFactor(orderBy) * undefinedNullableService.compareStrings(
            a as string,
            b as string
        );
        case 'number': return (a: Value | undefined | null, b: Value | undefined | null) => sortFactor(orderBy) * undefinedNullableService.subtract(
            a as number,
            b as number
        );
        case 'date': return (a: Value | undefined | null, b: Value | undefined | null) => sortFactor(orderBy) * undefinedNullableService.compareDates(
            a as Date,
            b as Date
        );
    }
    throw new Error('type not defined');
}

export function comparator<Value extends StringTypeMapped, A>(type: StringType<Value>, orderBy: 'ASC' | 'DESC', getter: (a: A) => Value | undefined | null): Comporator<A> {
    return (a, b) => primitivComparator(type, orderBy)(getter(a), getter(b));
}