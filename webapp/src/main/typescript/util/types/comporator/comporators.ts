import { Comporator } from "./comporator";

export function identityComporator<A>(): Comporator<A> {
    return (val1: A, val2: A) => 0;
}