import { Circle } from "../circle";
import { CollisionDetection } from "../collision-detection";
import { Point } from "../point";


class QuadtreeLeaf<Element extends Circle> {
    private static readonly COLLISION_DETECTION = new CollisionDetection();
    readonly elements: Element[] = [];

    getElements(p: [number, number], radius: number): Element[] {
        return this.elements.filter(elem => QuadtreeLeaf.COLLISION_DETECTION.circleCollision(elem, {
            center: { x: p[0], y: p[1] },
            radius
        }));
    }
}

/**
 *| q2 | q1 |
 * ---------
 *| q3 | q4 |
*/
export class Quadtree<
    Element extends Circle,
    NextStep extends Quadtree<Element, any> | QuadtreeLeaf<Element>
> implements Quadtree<Element, NextStep> {

    private readonly q1: NextStep;
    private readonly q2: NextStep;
    private readonly q3: NextStep;
    private readonly q4: NextStep;

    private readonly center: Point;
    private readonly size: Point;

    public constructor(
        depth: number & (NextStep extends QuadtreeLeaf<Element> ? 1 : number),
        area: { upperLeft: Point, lowerRight: Point }
    ) {
        if (depth <= 0) {
            throw "Depth <= 0 isnt allowed.";
        }
        this.size = {
            x: area.lowerRight.x - area.upperLeft.x,
            y: area.lowerRight.y - area.upperLeft.y
        };
        this.center = {
            x: area.upperLeft.x + this.size.x / 2,
            y: area.upperLeft.y + this.size.y / 2,
        };
        if (depth === 1) {
            this.q1 = new QuadtreeLeaf() as NextStep;
            this.q2 = new QuadtreeLeaf() as NextStep;
            this.q3 = new QuadtreeLeaf() as NextStep;
            this.q4 = new QuadtreeLeaf() as NextStep;
            return;
        }
        this.q1 = new Quadtree<Element, any>(depth - 1, {
            upperLeft: { x: this.center.x, y: area.upperLeft.y },
            lowerRight: { x: area.lowerRight.x, y: this.center.y },
        }) as NextStep;
        this.q2 = new Quadtree<Element, any>(depth - 1, {
            upperLeft: area.upperLeft,
            lowerRight: this.center
        }) as NextStep;
        this.q3 = new Quadtree<Element, any>(depth - 1, {
            upperLeft: { x: area.upperLeft.x, y: this.center.y },
            lowerRight: { x: this.center.x, y: area.lowerRight.y },
        }) as NextStep;
        this.q4 = new Quadtree<Element, any>(depth - 1, {
            upperLeft: this.center,
            lowerRight: area.lowerRight,
        }) as NextStep;
    }

    public insert(p: [number, number], element: Element): void {
        const nextStep = this.getNextStep(p);
        if ((nextStep as QuadtreeLeaf<Element>).elements) {
            (nextStep as QuadtreeLeaf<Element>).elements.push(element);
        } else {
            (nextStep as Quadtree<Element, any>).insert(p, element);
        }
    }

    private getNextStep(p: [number, number]): NextStep {
        /**
         * center.x
         *| q2 | q1 |
         * ---------  center.y
         *| q3 | q4 |
        */
        const [x, y] = p;
        if (y > this.center.y) {
            if (x > this.center.x) {
                return this.q1;
            } else {
                return this.q2;
            }
        } else {
            if (x > this.center.x) {
                return this.q4;
            } else {
                return this.q3;
            }
        }
    }

    public getElements(p: [number, number], radius: number): Element[] {
        if (Math.min(this.size.x / 2, this.size.y / 2) < radius) {
            let result: Element[] = [];
            for (const q of [this.q1, this.q2, this.q3, this.q4]) {
                result = result.concat(q.getElements(p, radius));
            }
            return result;
        } else {
            return this.getNextStep(p).getElements(p, radius);
        }
    }

}
