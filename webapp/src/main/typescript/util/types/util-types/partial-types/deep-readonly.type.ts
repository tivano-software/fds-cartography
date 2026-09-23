export type DeepReadonly<T> = Readonly<{
    [P in keyof T]: (
          T[P] extends (infer Entry)[] ? DeepReadonly<Entry>[]
        : T[P] extends object ? DeepReadonly<T[P]>
        : T[P]
    )
}>;