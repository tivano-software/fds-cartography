
export class Updater<A, Func extends (x: A, y: A) => A> {

    constructor(
        private innerVal: A,
        private readonly func: Func
    ) {}

    update(val: A): A {
        this.innerVal = this.func(this.innerVal, val);
        return this.innerVal;
    }

    get val(): A {
        return this.innerVal;
    }
}