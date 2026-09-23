import { Writeable } from "./writable.type";

export type DeepWritable<T> = Writeable<{
    [P in keyof T]: (
          T[P] extends (infer Entry)[] ? DeepWritable<Entry>[]
        : T[P] extends object ? DeepWritable<T[P]>
        : T[P]
    )
}>;