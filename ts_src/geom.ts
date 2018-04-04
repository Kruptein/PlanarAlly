/*
This module defines some Point classes.
A strong focus is made to ensure that at no time a global and a local point are in some way used instead of the other.
This adds some at first glance weird looking hacks as ts does not support nominal typing.
*/

class Point {
    x: number;
    y: number;
    constructor(x: number, y:number) {
        this.x = x;
        this.y = y;
    }
    add(vec: Vector<this>) {
        return new Point(this.x + vec.direction.x, this.y + vec.direction.y);
    }
    subtract(other: Point) {
        return new Vector({x: this.x - other.x, y: this.y - other.y}, this);
    }
    clone(): Point {
        return new Point(this.x, this.y);
    }
}
export class GlobalPoint extends Point {
    // this is to differentiate with LocalPoint, is actually never used
    // We do ! to prevent errors that it gets never initialized because yeah.
    _GlobalPoint!: string;
    add(vec: Vector<this>): GlobalPoint {
        return <GlobalPoint>super.add(vec);
    }
    subtract(other: GlobalPoint): Vector<this> {
         return super.subtract(other);
    }
    clone(): GlobalPoint {
        return <GlobalPoint>super.clone();
    }
}

export class LocalPoint extends Point {
    // this is to differentiate with GlobalPoint, is actually never used
    // We do ! to prevent errors that it gets never initialized because yeah.
    _LocalPoint!: string;
    add(vec: Vector<this>): LocalPoint {
        return <LocalPoint>super.add(vec);
    }
    subtract(other: LocalPoint): Vector<this> {
        return super.subtract(other);
    }
    clone(): LocalPoint {
        return <LocalPoint>super.clone();
    }
}

export class Vector<T extends Point> {
    direction: {x: number, y:number};
    origin?: T;
    constructor(direction: {x: number, y:number}, origin?: T) {
        this.direction = direction;
        this.origin = origin;
    }
    reverse() {
        return new Vector<T>({x: -this.direction.x, y: -this.direction.y}, this.origin);
    }
}

function pointInLine<T extends Point>(p: T, l1: T, l2: T) {
    return p.x >= Math.min(l1.x, l2.x) - 0.000001 &&
        p.x <= Math.max(l1.x, l2.x) + 0.000001 &&
        p.y >= Math.min(l1.y, l2.y) - 0.000001 &&
        p.y <= Math.max(l1.y, l2.y) + 0.000001;
}

function pointInLines<T extends Point>(p: T, s1: T, e1: T, s2: T, e2: T) {
    return pointInLine(p, s1, e1) && pointInLine(p, s2, e2);
}

export function getLinesIntersectPoint<T extends Point>(s1: T, e1: T, s2: T, e2: T) {
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

    const intersect = <T>{x: (B2*C1 - B1*C2)*invdelta, y: (A1*C2 - A2*C1)*invdelta};
    if (!pointInLines(intersect, s1, e1, s2, e2))
        return {intersect: null, parallel: false};
    return {intersect: intersect, parallel: false};
}

export function getPointDistance(p1: Point, p2: Point) {
    const a = p1.x - p2.x;
    const b = p1.y - p2.y;
    return Math.sqrt( a*a + b*b );
}