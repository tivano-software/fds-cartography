
export const call = <A, B extends (() => A) | void>(f: B): true => {
    if (typeof f === 'function') {
        f();
    } else {
        f;
    }
    return true;
};
