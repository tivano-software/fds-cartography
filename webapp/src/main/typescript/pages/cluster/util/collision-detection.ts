import { Circle } from "./circle";

export class CollisionDetection {

    public circleCollision(c1: Circle, c2: Circle): boolean {
        const [dx, dy] = [+c1.center.x - +c2.center.x, +c1.center.y - +c2.center.y];
        const d = dx * dx + dy * dy;
        const dCollision = (+c1.radius + +c2.radius) * (+c1.radius + +c2.radius);
        const isCollision = d < dCollision;
        return isCollision;
    }

}