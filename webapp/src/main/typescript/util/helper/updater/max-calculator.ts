import { Updater } from "./updater.template";

export class MaxCalculator extends Updater<number, (x: number, y: number) => number> {

    constructor() {
        super(
            -10000000,
            (x: number, y: number) => Math.max(x, y)
        );
    }
}