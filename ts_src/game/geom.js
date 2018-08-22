/*
This module defines some Point classes.
A strong focus is made to ensure that at no time a global and a local point are mixed up with each other.
At first glance this adds weird looking hacks as ts does not support nominal typing.
*/
export function getPointDistance(p1, p2) {
    const a = p1.x - p2.x;
    const b = p1.y - p2.y;
    return Math.sqrt(a * a + b * b);
}
export class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    add(vec) {
        return new Point(this.x + vec.x, this.y + vec.y);
    }
    subtract(other) {
        return new Vector(this.x - other.x, this.y - other.y);
    }
    clone() {
        return new Point(this.x, this.y);
    }
    get(dimension) {
        if (dimension == 0)
            return this.x;
        return this.y;
    }
}
export class GlobalPoint extends Point {
    add(vec) {
        return super.add(vec);
    }
    subtract(other) {
        return super.subtract(other);
    }
    clone() {
        return super.clone();
    }
}
export class LocalPoint extends Point {
    add(vec) {
        return super.add(vec);
    }
    subtract(other) {
        return super.subtract(other);
    }
    clone() {
        return super.clone();
    }
}
export class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    dot(other) {
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
    multiply(scale) {
        return new Vector(this.x * scale, this.y * scale);
    }
}
export class Ray {
    constructor(origin, direction, tMax) {
        this.direction = direction;
        this.origin = origin;
        if (tMax === undefined)
            tMax = Infinity;
        this.tMax = tMax;
    }
    static fromPoints(p1, p2) {
        const vec = new Vector(p2.x - p1.x, p2.y - p1.y);
        let maxT;
        if (Math.abs(vec.x) > 0.01)
            maxT = (p2.x - p1.x) / vec.x;
        else
            maxT = (p2.y - p1.y) / vec.y;
        return new Ray(p1, vec, maxT);
    }
    get(t) {
        return (new Point(this.origin.x + t * this.direction.x, this.origin.y + t * this.direction.y));
    }
    getDistance(t1, t2) {
        return Math.sqrt(Math.pow(t2 - t1, 2) * (Math.pow(this.direction.x, 2) + Math.pow(this.direction.y, 2)));
    }
    getT(t1, distance) {
        return t1 + Math.sqrt(Math.pow(distance, 2) / (Math.pow(this.direction.x, 2) + Math.pow(this.direction.y, 2)));
    }
}
//# sourceMappingURL=geom.js.map