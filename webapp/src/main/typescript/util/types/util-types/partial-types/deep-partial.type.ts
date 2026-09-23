export type DeepPartial<T> = Partial<{
    [P in keyof T]: (
          T[P] extends (infer Entry)[] ? DeepPartial<Entry>[]
        : T[P] extends object ? DeepPartial<T[P]>
        : T[P]
    )
}>;