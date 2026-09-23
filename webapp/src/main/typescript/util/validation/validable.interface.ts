import { Validator } from ".";
export interface Validable {
    getValidator(): Validator;
}