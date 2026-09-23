export type DeepRequired<T> = Required<{
    [P in keyof T]: (
          T[P] extends [infer X, infer Y] ? [DeepRequired<X>, DeepRequired<Y>]
        : T[P] extends [infer X, infer Y, infer Z] ? [DeepRequired<X>, DeepRequired<Y>, DeepRequired<Z>]
        : T[P] extends (infer Entry)[] ? DeepRequired<Entry>[]
        : T[P] extends object ? DeepRequired<T[P]>
        : T[P]
    )
}>;