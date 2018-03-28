import { Point } from "./utils";

function pointInLine(p: Point, l1: Point, l2: Point) {
    return p.x >= Math.min(l1.x, l2.x) - 0.000001 &&
        p.x <= Math.max(l1.x, l2.x) + 0.000001 &&
        p.y >= Math.min(l1.y, l2.y) - 0.000001 &&
        p.y <= Math.max(l1.y, l2.y) + 0.000001;
}

function pointInLines(p: Point, s1: Point, e1: Point, s2: Point, e2: Point) {
    return pointInLine(p, s1, e1) && pointInLine(p, s2, e2);
}

export function getLinesIntersectPoint(s1: Point, e1: Point, s2: Point, e2: Point) {
    // const s1 = Math.min(S1, )
    const A1 = e1.y-s1.y;
    const B1 = s1.x-e1.x;
    const A2 = e2.y-s2.y;
    const B2 = s2.x-e2.x;

    // Get delta and check if the lines are parallel
    const delta = A1*B2 - A2*B1;
    if(delta === 0) return {intersect: null, parallel: true};

    const C2 = A2*s2.x+B2*s2.y;
    const C1 = A1*s1.x+B1*s1.y;
    //invert delta to make division cheaper
    const invdelta = 1/delta;

    const intersect: Point = {x: (B2*C1 - B1*C2)*invdelta, y: (A1*C2 - A2*C1)*invdelta};
    if (!pointInLines(intersect, s1, e1, s2, e2))
        return {intersect: null, parallel: false};
    return {intersect: intersect, parallel: false};
}

export function getPointDistance(p1: Point, p2: Point) {
    const a = p1.x - p2.x;
    const b = p1.y - p2.y;
    return Math.sqrt( a*a + b*b );
}