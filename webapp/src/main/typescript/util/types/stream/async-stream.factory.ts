import { AsyncForEachStreamI, AsyncStream, AsyncStreamI } from "./async-stream";

export abstract class AsyncStreamFactory {

    static ofList<A>(list: A[] | IterableIterator<A>): AsyncStreamI<A> {
        const asyncForEachStream: AsyncForEachStreamI<A> = {
            forEach: async (callback: (val: A) => Promise<void>) => {
                for (const val of list) {
                    await callback(val);
                }
            }
        };
        return new AsyncStream(asyncForEachStream);
    }

    static ofElements<A>(...list: A[]): AsyncStreamI<A> {
        const asyncForEachStream: AsyncForEachStreamI<A> = {
            forEach: async (callback: (val: A) => Promise<void>) => {
                for (const val of list) {
                    await callback(val);
                }
            }
        };
        return new AsyncStream(asyncForEachStream);
    }
}