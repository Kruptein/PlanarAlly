/*
This module defines some Point classes.
A strong focus is made to ensure that at no time a global and a local point are mixed up with each other.
At first glance this adds weird looking hacks as ts does not support nominal typing.
*/

export function getPointDistance(p1: Point, p2: Point) {
    const a = p1.x - p2.x;
    const b = p1.y - p2.y;
    return Math.sqrt(a * a + b * b);
}

export class Point {
    readonly x: number;
    readonly y: number;
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
    add(vec: Vector) {
        return new Point(this.x + vec.x, this.y + vec.y);
    }
    subtract(other: Point) {
        return new Vector(this.x - other.x, this.y - other.y);
    }
    clone(): Point {
        return new Point(this.x, this.y);
    }
    get(dimension: 0 | 1) {
        if (dimension === 0) return this.x;
        return this.y;
    }
}
export class GlobalPoint extends Point {
    // This is to differentiate with LocalPoint, is actually never used
    // We do ! to prevent errors that it never gets initialized
    // tslint:disable-next-line:variable-name
    _GlobalPoint!: string;
    add(vec: Vector): GlobalPoint {
        return <GlobalPoint>super.add(vec);
    }
    subtract(other: GlobalPoint): Vector {
        return super.subtract(other);
    }
    clone(): GlobalPoint {
        return <GlobalPoint>super.clone();
    }
}

export class LocalPoint extends Point {
    // This is to differentiate with GlobalPoint, is actually never used
    // We do ! to prevent errors that it never gets initialized
    // tslint:disable-next-line:variable-name
    _LocalPoint!: string;
    add(vec: Vector): LocalPoint {
        return <LocalPoint>super.add(vec);
    }
    subtract(other: LocalPoint): Vector {
        return super.subtract(other);
    }
    clone(): LocalPoint {
        return <LocalPoint>super.clone();
    }
}

export class Vector {
    readonly x: number;
    readonly y: number;
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
    dot(other: Vector) {
        return this.x * other.x + this.y * other.y;
    }
    inverse() {
        return new Vector(1 / this.x, 1 / this.y);
    }
    length() {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
    }
    normalize() {
        const l = this.length();
        return new Vector(this.x / l, this.y / l);
    }
    reverse() {
        return new Vector(-this.x, -this.y);
    }
    multiply(scale: number) {
        return new Vector(this.x * scale, this.y * scale);
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
    get(t: number): T {
        return <T>new Point(this.origin.x + t * this.direction.x, this.origin.y + t * this.direction.y);
    }
    getDistance(t1: number, t2: number) {
        return Math.sqrt(Math.pow(t2 - t1, 2) * (Math.pow(this.direction.x, 2) + Math.pow(this.direction.y, 2)));
    }
    getT(t1: number, distance: number) {
        return t1 + Math.sqrt(Math.pow(distance, 2) / (Math.pow(this.direction.x, 2) + Math.pow(this.direction.y, 2)));
    }
}
