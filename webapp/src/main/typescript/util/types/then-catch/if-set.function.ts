interface Alternative<A> {
    then<B>(callback: (a: A) => B): Alternative<B>;
    otherwise<C>(fallback: () => C): Alternative<C>;
}

function alternativeThen<A>(a: A): Alternative<A> {
    const result: Alternative<A> = {
        then: <B>(callback: (a: A) => B): Alternative<B> => alternativeThen(callback(a)),
        otherwise: <C>(): Alternative<C> => alternativeOtherwise()
    };
    return result;
}

function alternativeOtherwise<A>(): Alternative<A> {
    const result: Alternative<A> = {
        then: alternativeOtherwise,
        otherwise: <C>(fallback: () => C): Alternative<C> => alternativeThen(fallback())
    };
    return result;
}

interface IfSet<A> extends Alternative<A> {
    eval: () => boolean;
    orDefault(defaultVal: A): A;
    andIfSet<B>(getter: (val: A) => B | undefined | null): Alternative<B>;
}

export function ifSet<A>(val: A | undefined | null): IfSet<A> {
    const isSet = val !== undefined && val !== null;
    const result: IfSet<A> = {
        eval: (): boolean => isSet,
        orDefault: (defaultVal: A): A => isSet
            ? val
            : defaultVal,
        then: function <B>(callback: (a: A) => B): Alternative<B> {
            if (isSet) {
                const result = callback(val);
                return alternativeThen(result);
            }
            return alternativeOtherwise();
        },
        andIfSet: function <B>(getter: (val: A) => B | null | undefined): Alternative<B> {
            if (isSet) {
                return ifSet(getter(val));
            }
            return alternativeOtherwise();
        },
        otherwise: function <C>(fallback: () => C): Alternative<C> {
            if (!ifSet) {
                return alternativeThen(fallback());
            }
            return alternativeOtherwise();
        }
    }
    return result;
}