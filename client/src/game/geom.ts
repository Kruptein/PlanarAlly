/*
This module defines some Point classes.
A strong focus is made to ensure that at no time a global and a local point are mixed up with each other.
At first glance this adds weird looking hacks as ts does not support nominal typing.
*/

function getPointDistance(p1: Point | Vector, p2: Point | Vector): number {
    const a = p1.x - p2.x;
    const b = p1.y - p2.y;
    return Math.sqrt(a * a + b * b);
}

export function getDistanceToSegment(p: Point, line: [Point, Point]): number {
    const lineVector = Vector.fromPoints(...line);
    const pointVector = Vector.fromPoints(line[0], p);
    const pointVectorScaled = pointVector.multiply(1 / lineVector.length());
    let t = lineVector.normalize().dot(pointVectorScaled);
    if (t < 0) t = 0;
    else if (t > 1) t = 1;
    const nearest = lineVector.multiply(t);
    return getPointDistance(nearest, pointVector);
}

export class Point {
    readonly x: number;
    readonly y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    *[Symbol.iterator](): Generator<number> {
        yield this.x;
        yield this.y;
    }

    static fromArray(point: number[]): Point {
        return new Point(point[0], point[1]);
    }
    add(vec: Vector | this): this {
        return new (this as any).constructor(this.x + vec.x, this.y + vec.y);
    }
    subtract(other: Vector | this): Vector {
        return new Vector(this.x - other.x, this.y - other.y);
    }
    clone(): this {
        return new (this as any).constructor(this.x, this.y);
    }
    get(dimension: 0 | 1): number {
        if (dimension === 0) return this.x;
        return this.y;
    }
    asArray(): number[] {
        return [this.x, this.y];
    }
    equals(other: GlobalPoint, delta = 0.0001): boolean {
        return Math.abs(this.x - other.x) < delta && Math.abs(this.y - other.y) < delta;
    }
}
export class GlobalPoint extends Point {
    // This is to differentiate with LocalPoint, is actually never used
    // We do ! to prevent errors that it never gets initialized
    // tslint:disable-next-line:variable-name
    _GlobalPoint!: string;
    static fromArray(point: number[]): GlobalPoint {
        return new GlobalPoint(point[0], point[1]);
    }
}

export class LocalPoint extends Point {
    // This is to differentiate with GlobalPoint, is actually never used
    // We do ! to prevent errors that it never gets initialized
    // tslint:disable-next-line:variable-name
    _LocalPoint!: string;
}

export class Vector {
    readonly x: number;
    readonly y: number;
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
    static fromPoints(p1: Point, p2: Point): Vector {
        return new Vector(p2.x - p1.x, p2.y - p1.y);
    }

    *[Symbol.iterator](): Generator<number> {
        yield this.x;
        yield this.y;
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
    angle(): number {
        return (Math.atan2(this.y, this.x) * 180) / Math.PI;
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
        return new Point(this.origin.x + t * this.direction.x, this.origin.y + t * this.direction.y) as T;
    }
    getDistance(t1: number, t2: number): number {
        return Math.sqrt(Math.pow(t2 - t1, 2) * (Math.pow(this.direction.x, 2) + Math.pow(this.direction.y, 2)));
    }
    getT(t1: number, distance: number): number {
        return t1 + Math.sqrt(Math.pow(distance, 2) / (Math.pow(this.direction.x, 2) + Math.pow(this.direction.y, 2)));
    }
}
