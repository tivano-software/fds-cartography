
export type Unoptionalize<T> = {
    [A in keyof T]-?: T[A]
}