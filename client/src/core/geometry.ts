import { l2g } from "./conversions";

/*
This module defines some Point classes.
A strong focus is made to ensure that at no time a global and a local point are mixed up with each other.
At first glance this adds weird looking hacks as ts does not support nominal typing.
*/
export function getPointDistance(p1: Point | Vector, p2: Point | Vector): number {
    const a = p1.x - p2.x;
    const b = p1.y - p2.y;
    return Math.sqrt(a * a + b * b);
}

// faster than getPointDistance when the actual distance is not needed (e.g. just finding the closest of a bunch of points)
export function getPointDistanceSquared(p1: Point | Vector, p2: Point | Vector): number {
    const a = p1.x - p2.x;
    const b = p1.y - p2.y;
    return a * a + b * b;
}

export function getDistanceToSegment<T extends Point>(p: T, line: [T, T]): { distance: number; nearest: T } {
    const lineVector = Vector.fromPoints(...line);
    const pointVector = Vector.fromPoints(line[0], p);
    const pointVectorScaled = pointVector.multiply(1 / lineVector.length());
    let t = lineVector.normalize().dot(pointVectorScaled);
    if (t < 0) t = 0;
    else if (t > 1) t = 1;
    const nearest = lineVector.multiply(t);
    return { distance: getPointDistance(nearest, pointVector), nearest: addP(line[0], nearest) };
}

export function getAngleBetween(a: Vector, b: Vector): number {
    return -a.angle() + b.angle(); // inverted y-axis
}

export interface Point {
    x: number;
    y: number;
}
export type GlobalPoint = Point & { __brand: "GlobalPoint" };
export type LocalPoint = Point & { __brand: "LocalPoint" };

export function toGP(array: [number, number]): GlobalPoint;
export function toGP(x: number, y: number): GlobalPoint;
export function toGP(first: number | [number, number], second?: number): GlobalPoint {
    if (first instanceof Array) return { x: first[0], y: first[1] } as GlobalPoint;
    return { x: first, y: second! } as GlobalPoint;
}

export function toLP(x: number, y: number): LocalPoint {
    return { x, y } as LocalPoint;
}

export function toArrayP<T extends Point>(a: T): [number, number] {
    return [a.x, a.y];
}

export function equalsP<T extends Point>(a: T, b: T, delta = 0.0001): boolean {
    return Math.abs(a.x - b.x) < delta && Math.abs(a.y - b.y) < delta;
}

export function cloneP<T extends Point>(point: T): T {
    return { x: point.x, y: point.y } as T;
}

export function addP<T extends Point>(point: T, vec: Vector): T {
    return { x: point.x + vec.x, y: point.y + vec.y } as T;
}

export function subtractP<T extends Point>(a: T, b: T | Vector): Vector {
    return new Vector(a.x - b.x, a.y - b.y);
}

export class Vector {
    readonly x: number;
    readonly y: number;
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    static fromPoint(p: Point): Vector {
        return new Vector(p.x, p.y);
    }

    static fromPoints(p1: Point, p2: Point): Vector {
        return new Vector(p2.x - p1.x, p2.y - p1.y);
    }

    static fromArray(a: [number, number]): Vector {
        return new Vector(a[0], a[1]);
    }

    asArray(): [number, number] {
        return [this.x, this.y];
    }

    dot(other: Vector): number {
        return this.x * other.x + this.y * other.y;
    }
    /**
     * This will return (+/-)Infinity for x/y if they are 0.
     * This is intended behaviour! (otherwise BoundingRect.containsRay will not work properly)
     */
    inverse(): Vector {
        return new Vector(1 / this.x, 1 / this.y);
    }
    squaredLength(): number {
        return Math.pow(this.x, 2) + Math.pow(this.y, 2);
    }
    length(): number {
        return Math.sqrt(this.squaredLength());
    }
    normalize(): Vector {
        const l = this.length();
        return new Vector(this.x / l, this.y / l);
    }
    reverse(): Vector {
        return new Vector(-this.x, -this.y);
    }
    add(other: Vector): Vector {
        return new Vector(this.x + other.x, this.y + other.y);
    }
    multiply(scale: number): Vector {
        return new Vector(this.x * scale, this.y * scale);
    }

    deg(): number {
        return (this.angle() * 180) / Math.PI;
    }

    angle(): number {
        return Math.atan2(this.y, this.x);
    }
}

export class Ray<T extends Point> {
    readonly direction: Vector;
    readonly origin: T;
    tMax: number;
    constructor(origin: T, direction: Vector, tMax?: number) {
        this.direction = direction;
        this.origin = origin;
        if (tMax === undefined) tMax = Infinity;
        this.tMax = tMax;
    }
    static fromPoints<T extends Point>(p1: T, p2: T): Ray<T> {
        const vec = new Vector(p2.x - p1.x, p2.y - p1.y);
        let maxT;
        if (Math.abs(vec.x) > 0.01) maxT = (p2.x - p1.x) / vec.x;
        else maxT = (p2.y - p1.y) / vec.y;
        return new Ray(p1, vec, maxT);
    }

    static toGlobalRay(ray: Ray<LocalPoint>): Ray<GlobalPoint> {
        return new Ray(l2g(ray.origin), ray.direction, ray.tMax);
    }

    get(t: number): T {
        return { x: this.origin.x + t * this.direction.x, y: this.origin.y + t * this.direction.y } as T;
    }
    getDistance(t1: number, t2: number): number {
        return Math.sqrt(Math.pow(t2 - t1, 2) * (Math.pow(this.direction.x, 2) + Math.pow(this.direction.y, 2)));
    }
    getT(t1: number, distance: number): number {
        return t1 + Math.sqrt(Math.pow(distance, 2) / (Math.pow(this.direction.x, 2) + Math.pow(this.direction.y, 2)));
    }
    getPointAtDistance(distance: number, startT = 0): T {
        return addP(this.get(startT), this.direction.normalize().multiply(distance));
    }
}

export function getCenterLine(start: [number, number], end: [number, number]): [number, number] {
    return [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2];
}
