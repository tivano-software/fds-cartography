
export type Undefinedable<A> = A | undefined;
export type Nullable<A> = A | null;


export class UndefinedNullableService {

    transformNumber(val: Undefinedable<number>  | Nullable<number>): number {
        if (val === null || val === undefined) {
            return 0;
        }
        return val;
    }

    transformString(val: Undefinedable<string>  | Nullable<string>): string {
        if (val === null || val === undefined) {
            return "";
        }
        return val;
    }

    subtract(val1: Undefinedable<number>  | Nullable<number>, val2: Undefinedable<number>  | Nullable<number>): number {
        const val1AsNumber = this.transformNumber(val1);
        const val2AsNumber = this.transformNumber(val2);
        return val1AsNumber - val2AsNumber;
    }

    compareStrings(val1: Undefinedable<string>  | Nullable<string>, val2: Undefinedable<string>  | Nullable<string>): number {
        const val1AsString = this.transformString(val1);
        const val2AsString = this.transformString(val2);
        return val1AsString.localeCompare(val2AsString);
    }

    compareDates(val1: Undefinedable<Date>  | Nullable<Date>, val2: Undefinedable<Date>  | Nullable<Date>): number {
        return this.subtract(val1 ? val1.getTime() : -1, val2 ? val2.getTime() : -1);
    }

    compareNumber(val1: Undefinedable<number>  | Nullable<number>, val2: Undefinedable<number>  | Nullable<number>): number {
        return this.subtract(val1, val2);
    }

}