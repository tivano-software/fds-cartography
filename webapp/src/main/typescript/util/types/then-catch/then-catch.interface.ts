
export interface ThenCatch<A, Error> {
    then<B>(func: (val: A) => B): ThenCatch<B, Error>;
    catch<B>(func: (error: Error) => B): ThenCatch<B, Error>;
}