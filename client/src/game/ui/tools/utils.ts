import { GlobalPoint, Vector } from "@/game/geom";
import { Shape } from "@/game/shapes/shape";
import { getCDT, TriangulationTarget } from "@/game/visibility/te/pa";
import { Point, Sign, Triangle } from "@/game/visibility/te/tds";
import { ccw, cw, intersection, orientation } from "@/game/visibility/te/triag";

// First go through each shape in the selection and see if the delta has to be truncated due to movement blockers

// This is definitely super convoluted and inefficient but I was tired and really wanted the smooth wall sliding collision stuff to work
// And it does now, so hey ¯\_(ツ)_/¯
export function calculateDelta(delta: Vector, sel: Shape): Vector {
    if (delta.x === 0 && delta.y === 0) return delta;
    const centerTriangle = getCDT(TriangulationTarget.MOVEMENT, sel.floor).locate(sel.center().asArray(), null).loc;
    for (const point of sel.points) {
        const lt = getCDT(TriangulationTarget.MOVEMENT, sel.floor).locate(point, centerTriangle);
        const triangle = lt.loc;
        if (triangle === null) continue;
        delta = checkTriangle(point, triangle, delta);
    }
    return delta;
}

function checkTriangle(point: Point, triangle: Triangle, delta: Vector, skip: Triangle[] = []): Vector {
    const p = new GlobalPoint(point[0], point[1]);
    const endpoint = p.add(delta).asArray();
    if (triangle.contains(endpoint)) return delta;
    skip.push(triangle);

    for (let i = 0; i < 3; i++) {
        if (skip.includes(triangle.neighbours[i]!)) continue;

        const _cw = triangle.vertices[cw(i)]!.point!;
        const _ccw = triangle.vertices[ccw(i)]!.point!;
        const ix = intersection(point, endpoint, _cw, _ccw);

        if (ix === null) continue;

        if (!triangle.isConstrained(i)) return checkTriangle(point, triangle.neighbours[i]!, delta, skip);

        if (ix[0] === p.x && ix[1] === p.y) {
            const o = orientation(point, endpoint, _ccw);
            // Remember: canvas y axis is inverted
            if (o === Sign.LEFT_TURN) continue;
            if (o === Sign.ZERO) continue;
        }
        let newDelta = new GlobalPoint(ix[0], ix[1]).subtract(p).multiply(0.8);
        if (newDelta.length() < 1) newDelta = new Vector(0, 0);
        if (newDelta.length() < delta.length()) delta = newDelta;
    }
    return delta;
}
