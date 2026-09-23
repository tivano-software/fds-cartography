import { AsyncStreamFactory } from "./async-stream.factory";


export interface AsyncForEachStreamI<A> {
    forEach(callback: (val: A) => Promise<void>): Promise<void>;
}

type CollectType = 'stream';
type CollectResult<Type extends CollectType, A> =
    Type extends 'stream' ? AsyncStreamI<A>
    : never;

export interface FoldParam<A, FoldResult> {
    folder: (result: FoldResult, val: A) => Promise<FoldResult>,
    initial: FoldResult
}

export interface AsyncStreamI<A> extends AsyncForEachStreamI<A> {
    /**
     * Attention: Use this function only if you call after this function forEach or toList.
     * If you won't do so, you will not be able to wait for the async operation.
     */
    map<B>(mapper: (val: A) => Promise<B>): AsyncStreamI<B>;
    fold<FoldResult>(params: FoldParam<A, FoldResult>): Promise<FoldResult>;
    filter<B>(taker: (val: A, take: (b: B) => void) => Promise<void>): AsyncStreamI<B>;
    forEach(callbacks: ((val: A) => Promise<void>)): Promise<void>;
    toList(): Promise<A[]>;
    collect<Type extends CollectType>(type: Type): Promise<CollectResult<Type, A>>;
}

export class AsyncStream<A> implements AsyncStreamI<A> {

    constructor(
        private forEachStream: AsyncForEachStreamI<A>
    ) { }

    public async collect<Type extends CollectType>(type: Type): Promise<CollectResult<Type, A>> {
        switch (type) {
            case 'stream':
            default:
                const list = await this.toList();
                const result: CollectResult<'stream', A> = AsyncStreamFactory.ofList(list);
                return result as CollectResult<Type, A>;
        }
    }

    public filter<B>(taker: (val: A, take: (b: B) => void) => Promise<void>): AsyncStreamI<B> {
        return new AsyncStream<B>({
            forEach: async (callback: (val: B) => Promise<void>) => {
                await this.forEach(async val => {
                    await taker(val, callback);
                });
            }
        });
    }

    public map<B>(mapper: (val: A) => Promise<B>): AsyncStreamI<B> {
        return new AsyncStream<B>({
            forEach: async (callback: (val: B) => Promise<void>) => {
                await this.forEach(async (val: A) => {
                    const mapped = await mapper(val);
                    await callback(mapped);
                });
            }
        });
    }

    public async fold<FoldResult>(params: FoldParam<A, FoldResult>): Promise<FoldResult> {
        let result = params.initial;
        await this.forEach(async val => {
            result = await params.folder(result, val);
        });
        return result;
    }

    public async forEach(callback: ((val: A) => Promise<void>)): Promise<void> {
        return await this.forEachStream.forEach(async (val: A) => {
            await callback(val);
        });
    }

    public async toList(): Promise<A[]> {
        const list: A[] = [];
        await this.forEach(async val => {
            list.push(val);
        });
        return list;
    }

}