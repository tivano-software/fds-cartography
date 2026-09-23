import { LocationsToLocationsDistances } from "../../../client";
import { TSNEOptions } from "../../../util/math/tsne";
import { TSNE } from "../../../util/math/tsne";
import { Point } from "./point";

export interface ProjectionResult {
    name: string;
    coordinates: Point;
}

export class Projection {
    private readonly tsne: TSNE;
    private cancel: boolean = false;
    private currentRun: Promise<ProjectionResult[]> | undefined = undefined;
    private readonly names: Array<string>;
    private readonly stepCallback: (state: ProjectionResult[], iteration: number, cost: number) => boolean;
    constructor(input: LocationsToLocationsDistances, stepCallback: (state: ProjectionResult[], iteration: number, cost: number) => boolean) {
        const rows = input.data ?? [];
        this.names = rows.map(entry => entry.location ?? "");
        const getDistance = (i : number, j : number) => {
            if (i === j) { return 0; }
            else {
                // swap indexes to access to upper half of the matrix
                if (j>i) { const tmp = j; j=i; i=tmp; }
                const row = rows[i].distances || [];
                return row[j] ?? 0;
            }
        }
        const opts: TSNEOptions = {
            dim: 2,
            perplexity: Math.sqrt(rows.length) // TODO: find a better (and better reasoned) perplexity value
        }
        this.tsne = new TSNE(opts);
        this.tsne.initDataDistFunction(getDistance, rows.length);
        this.stepCallback = stepCallback;

        // Make sure that step() is always bound to this object - need to do this here because it is used
        // as a callback function for setTimeout() later on.
        this.step = this.step.bind(this);
    }

    public async run(): Promise<ProjectionResult[]> {
        if (this.currentRun) {
            await this.stop();
        }
        this.currentRun = new Promise(resolve => {
            setTimeout(this.step, 0, this.stepCallback, resolve);
        });
        return this.currentRun;
    }

    private step(intermediateResultCallback: (result: ProjectionResult[], iteration: number, cost: number) => boolean, finalResultCallback: (result: ProjectionResult[]) => void): void {
        const tsne = this.tsne;
        const cost = tsne.step();
        const iter = tsne.getIteration();
        const solution = tsne.getSolution().map((value, index) => {
            return {
                name: this.names[index],
                coordinates: {
                    x: value[0],
                    y: value[1]
                }
            };
        });
        const finished = intermediateResultCallback(solution, iter, cost) || this.cancel;
        if (finished) {
            finalResultCallback(solution);
            this.cancel = finished;
        } else {
            setTimeout(this.step, 0, intermediateResultCallback, finalResultCallback)
        }
    }

    public async stop() : Promise<void> {
        if (this.currentRun) {
            this.cancel = true;
            await this.currentRun;
            this.currentRun = undefined;
            this.cancel = false;
        }
    }
}