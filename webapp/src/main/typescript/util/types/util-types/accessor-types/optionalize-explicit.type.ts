
export type OptionalizeExplicit<T, Keys extends (keyof T)[]> = {
    [A in keyof T]: A extends Keys[number] ? undefined | T[A] : T[A];
};