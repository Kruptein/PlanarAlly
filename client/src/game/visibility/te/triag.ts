import { GlobalPoint, Ray } from "@/game/geom";
import { EdgeCirculator, Point, Sign, Triangle, Vertex } from "./tds";
import { equalPoint } from "@/game/utils";

type Line = number[];

export function cw(index: number): number {
    return (index + 2) % 3;
}

export function ccw(index: number): number {
    return (index + 1) % 3;
}

export function edgeInfo(
    va: Vertex,
    vb: Vertex,
): { includes: false } | { includes: true; vi: Vertex; fr: Triangle; i: number } {
    const ec = new EdgeCirculator(va, null);
    if (ec.valid) {
        do {
            const indv = 3 - ec.t!.indexV(va) - ec.ri;
            const v = ec.t!.vertices[indv]!;
            if (!v.infinite) {
                if (v === vb) {
                    return { includes: true, vi: vb, fr: ec.t!, i: ec.ri };
                } else {
                    const orient = orientation(va.point!, vb.point!, v.point!);
                    if (orient === Sign.COLLINEAR && collinearBetween(va.point!, v.point!, vb.point!)) {
                        return { includes: true, vi: v, fr: ec.t!, i: ec.ri };
                    }
                }
            }
        } while (ec.next());
    }
    return { includes: false };
}

export function collinearBetween(p: Point, q: Point, r: Point): boolean {
    let cPQ: Sign;
    let cQR: Sign;
    if (compare(0, p, r) === Sign.EQUAL) {
        cPQ = compare(1, p, q);
        cQR = compare(1, q, r);
    } else {
        cPQ = compare(0, p, q);
        cQR = compare(0, q, r);
    }
    return (cPQ === Sign.SMALLER && cQR === Sign.SMALLER) || (cPQ === Sign.LARGER && cQR === Sign.LARGER);
}

function compare(index: number, a: Point, b: Point): Sign {
    if (a[index] < b[index]) return Sign.SMALLER;
    if (a[index] > b[index]) return Sign.LARGER;
    return Sign.EQUAL;
}

export function orientation(p: Point, q: Point, r: Point): Sign {
    const px = p[0];
    const py = p[1];
    const qx = q[0];
    const qy = q[1];
    const rx = r[0];
    const ry = r[1];
    const pqx = qx - px;
    const pqy = qy - py;
    const prx = rx - px;
    const pry = ry - py;
    const det = determinant(pqx, pqy, prx, pry);
    let maxX = Math.abs(pqx);
    let maxY = Math.abs(pqy);
    const aprX = Math.abs(prx);
    const aprY = Math.abs(pry);
    if (maxX < aprX) maxX = aprX;
    if (maxY < aprY) maxY = aprY;
    if (maxX > maxY) [maxX, maxY] = [maxY, maxX];
    // underflow proection in eps computation?? Math.sqrt(Number.MIN_VALUE, Number.EPSILON)
    if (maxX < 2e-162 && maxX === 0) {
        return Sign.ZERO;
    }
    // overflow protection in det computation
    if (maxY < 1e153) {
        const eps = Number.EPSILON * maxX * maxY;
        if (det > eps) return Sign.POSITIVE;
        if (det < -eps) return Sign.NEGATIVE;
    }
    return Sign.ZERO;
}

export function determinant(a00: number, a01: number, a10: number, a11: number): number {
    return a00 * a11 - a01 * a10;
}

export function hasInexactNegativeOrientation(p: Point, q: Point, r: Point): boolean {
    return determinant(q[0] - p[0], q[1] - p[1], r[0] - p[0], r[1] - p[1]) < 0;
}

export function sideOfOrientedCircle(t: Triangle, p: Point, perturb: boolean): Sign {
    if (!t.isInfinite())
        return sideOfOrientedCircleP(t.vertices[0]!.point!, t.vertices[1]!.point!, t.vertices[2]!.point!, p, perturb);
    throw new Error("SSS");
}

export function sideOfOrientedCircleP(p0: Point, p1: Point, p2: Point, p: Point, perturb: boolean): Sign {
    const os = getOrientedSide(p0, p1, p2, p);
    if (os !== Sign.ON_ORIENTED_BOUNDARY || !perturb) return os;
    const points = [p0, p1, p2, p];
    points.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    for (const point of points.reverse()) {
        if (point === p) return Sign.ON_NEGATIVE_SIDE;
        let o = orientation(p0, p1, p);
        if (point === p2 && o !== Sign.COLLINEAR) return o;
        o = orientation(p0, p, p2);
        if (point === p1 && o !== Sign.COLLINEAR) return o;
        o = orientation(p, p1, p2);
        if (point === p0 && o !== Sign.COLLINEAR) return o;
    }
    return Sign.ON_NEGATIVE_SIDE;
}

export function xyEqual(p: Point, q: Point): boolean {
    return equalPoint(p[0], q[0]) && equalPoint(p[1], q[1]);
}

export function xySmaller(p: Point, q: Point): boolean {
    return p[0] < q[0] - 0.0001 || (equalPoint(p[0], q[0]) && p[1] < q[1] - 0.0001);
}

export function xyCompare(p: Point, q: Point): Sign {
    if (xySmaller(p, q)) return Sign.SMALLER;
    if (xyEqual(p, q)) return Sign.EQUAL;
    return Sign.LARGER;
}

function getOrientedSide(p: Point, q: Point, r: Point, t: Point): Sign {
    const qpx = q[0] - p[0];
    const qpy = q[1] - p[1];
    const rpx = r[0] - p[0];
    const rpy = r[1] - p[1];
    const tpx = t[0] - p[0];
    const tpy = t[1] - p[1];
    const tqx = t[0] - q[0];
    const tqy = t[1] - q[1];
    const rqx = r[0] - q[0];
    const rqy = r[1] - q[1];

    const det = determinant(qpx * tpy - qpy * tpx, tpx * tqx + tpy * tqy, qpx * rpy - qpy * rpx, rpx * rqx + rpy * rqy);
    let maxx = Math.abs(qpx);
    let maxy = Math.abs(qpy);
    const arpx = Math.abs(rpx);
    const arpy = Math.abs(rpy);
    const atqx = Math.abs(tqx);
    const atqy = Math.abs(tqy);
    const atpx = Math.abs(tpx);
    const atpy = Math.abs(tpy);
    const arqx = Math.abs(rqx);
    const arqy = Math.abs(rqy);

    if (maxx < arpx) maxx = arpx;
    if (maxx < atpx) maxx = atpx;
    if (maxx < atqx) maxx = atqx;
    if (maxx < arqx) maxx = arqx;

    if (maxy < arpy) maxy = arpy;
    if (maxy < atpy) maxy = atpy;
    if (maxy < atqy) maxy = atqy;
    if (maxy < arqy) maxy = arqy;

    if (maxx > maxy) [maxx, maxy] = [maxy, maxx];

    if (maxx < 1e-73 && maxx === 0) return Sign.ON_ORIENTED_BOUNDARY;
    // sqrt(sqrt(max_double/16
    else if (maxy < 1e76) {
        const eps = Number.EPSILON * maxx * maxy * (maxy * maxy);
        if (det > eps) return Sign.ON_POSITIVE_SIDE;
        if (det < -eps) return Sign.ON_NEGATIVE_SIDE;
    }

    return Sign.ZERO;
}

function segSegDoIntersectCrossing(p1: Point, p2: Point, p3: Point, p4: Point): boolean {
    switch (orientation(p1, p2, p3)) {
        case Sign.LEFT_TURN:
            return orientation(p3, p4, p2) !== Sign.RIGHT_TURN;
        case Sign.RIGHT_TURN:
            return orientation(p3, p4, p2) !== Sign.LEFT_TURN;
        case Sign.COLLINEAR:
            return true;
    }
}

function segSegDoIntersectContained(p1: Point, p2: Point, p3: Point, p4: Point): boolean {
    switch (orientation(p1, p2, p3)) {
        case Sign.LEFT_TURN:
            return orientation(p1, p2, p4) !== Sign.LEFT_TURN;
        case Sign.RIGHT_TURN:
            return orientation(p1, p2, p4) !== Sign.RIGHT_TURN;
        case Sign.COLLINEAR:
            return true;
    }
}

export function intersection(pa: Point, pb: Point, pc: Point, pd: Point): Point | null {
    const i = getIntersectionType(pa, pb, pc, pd);
    switch (i.intersectionType) {
        case IntersectionType.POINT:
            return i.point!;
        case IntersectionType.NO_INTERSECTION:
            return null;
    }
    throw new Error("sdfgighowen");
}

enum IntersectionType {
    NO_INTERSECTION,
    POINT,
    SEGMENT,
}

function getLine(p0: Point, p1: Point): Line {
    if (p0[0] === p1[0]) return [1, 0, -p0[0]];
    if (p0[1] === p1[1]) return [0, 1, -p0[1]];
    const x = p1[0] - p0[0];
    const y = p1[1] - p0[1];
    return [-y, x, -x * p0[1] + y * p0[0]];
}

function getIntersectionType(
    pa: Point,
    pb: Point,
    pc: Point,
    pd: Point,
): { intersectionType: IntersectionType; point: Point | null } {
    if (!doIntersect(pa, pb, pc, pd)) return { intersectionType: IntersectionType.NO_INTERSECTION, point: null };
    const l1 = getLine(pa, pb);
    const l2 = getLine(pc, pd);
    const info = getIntersectionTypeLine(l1, l2);
    switch (info.intersectionType) {
        case IntersectionType.POINT: {
            return info;
        }
    }
    throw new Error("gzseuihgpib");
}

function getIntersectionTypeLine(la: Line, lb: Line): { intersectionType: IntersectionType; point: Point } {
    const denom = la[0] * lb[1] - lb[0] * la[1];
    const nom1 = la[1] * lb[2] - lb[1] * la[2];
    const nom2 = lb[0] * la[2] - la[0] * lb[2];
    return {
        intersectionType: IntersectionType.POINT,
        point: [nom1 / denom, nom2 / denom],
    };
}

function doIntersect(A1: Point, A2: Point, B1: Point, B2: Point): boolean {
    if (xySmaller(A1, A2)) {
        if (xySmaller(B1, B2)) {
            if (xySmaller(A2, B1) || xySmaller(B2, A1)) return false;
        } else {
            if (xySmaller(A2, B2) || xySmaller(B1, A1)) return false;
        }
    } else {
        if (xySmaller(B1, B2)) {
            if (xySmaller(A1, B1) || xySmaller(B2, A2)) return false;
        } else {
            if (xySmaller(A1, B2) || xySmaller(B1, A2)) return false;
        }
    }
    if (xySmaller(A1, A2)) {
        if (xySmaller(B1, B2)) {
            switch (xyCompare(A1, B1)) {
                case Sign.SMALLER: {
                    switch (xyCompare(A2, B1)) {
                        case Sign.SMALLER:
                            return false;
                        case Sign.EQUAL:
                            return true;
                        default: {
                            switch (xyCompare(A2, B2)) {
                                case Sign.SMALLER:
                                    return segSegDoIntersectCrossing(A1, A2, B1, B2);
                                case Sign.EQUAL:
                                    return true;
                                default:
                                    return segSegDoIntersectContained(A1, A2, B1, B2);
                            }
                        }
                    }
                }
                case Sign.EQUAL:
                    return true;
                default:
                    switch (xyCompare(B2, A1)) {
                        case Sign.SMALLER:
                            return false;
                        case Sign.EQUAL:
                            return true;
                        default: {
                            switch (xyCompare(B2, A2)) {
                                case Sign.SMALLER:
                                    return segSegDoIntersectCrossing(B1, B2, A1, A2);
                                case Sign.EQUAL:
                                    return true;
                                default:
                                    return segSegDoIntersectContained(B1, B2, A1, A2);
                            }
                        }
                    }
            }
        } else {
            switch (xyCompare(A1, B2)) {
                case Sign.SMALLER: {
                    switch (xyCompare(A2, B2)) {
                        case Sign.SMALLER:
                            return false;
                        case Sign.EQUAL:
                            return true;
                        default: {
                            switch (xyCompare(A2, B1)) {
                                case Sign.SMALLER:
                                    return segSegDoIntersectCrossing(A1, A2, B2, B1);
                                case Sign.EQUAL:
                                    return true;
                                default:
                                    return segSegDoIntersectContained(A1, A2, B2, B1);
                            }
                        }
                    }
                }
                case Sign.EQUAL:
                    return true;
                default:
                    switch (xyCompare(B1, A1)) {
                        case Sign.SMALLER:
                            return false;
                        case Sign.EQUAL:
                            return true;
                        default: {
                            switch (xyCompare(B1, A2)) {
                                case Sign.SMALLER:
                                    return segSegDoIntersectCrossing(B2, B1, A1, A2);
                                case Sign.EQUAL:
                                    return true;
                                default:
                                    return segSegDoIntersectContained(B2, B1, A1, A2);
                            }
                        }
                    }
            }
        }
    } else {
        if (xySmaller(B1, B2)) {
            switch (xyCompare(A2, B1)) {
                case Sign.SMALLER: {
                    switch (xyCompare(A1, B1)) {
                        case Sign.SMALLER:
                            return false;
                        case Sign.EQUAL:
                            return true;
                        default: {
                            switch (xyCompare(A1, B2)) {
                                case Sign.SMALLER:
                                    return segSegDoIntersectCrossing(A2, A1, B1, B2);
                                case Sign.EQUAL:
                                    return true;
                                default:
                                    return segSegDoIntersectContained(A2, A1, B1, B2);
                            }
                        }
                    }
                }
                case Sign.EQUAL:
                    return true;
                default:
                    switch (xyCompare(B2, A2)) {
                        case Sign.SMALLER:
                            return false;
                        case Sign.EQUAL:
                            return true;
                        default: {
                            switch (xyCompare(B2, A1)) {
                                case Sign.SMALLER:
                                    return segSegDoIntersectCrossing(B1, B2, A2, A1);
                                case Sign.EQUAL:
                                    return true;
                                default:
                                    return segSegDoIntersectContained(B1, B2, A2, A1);
                            }
                        }
                    }
            }
        } else {
            switch (xyCompare(A2, B2)) {
                case Sign.SMALLER: {
                    switch (xyCompare(A1, B2)) {
                        case Sign.SMALLER:
                            return false;
                        case Sign.EQUAL:
                            return true;
                        default: {
                            switch (xyCompare(A1, B1)) {
                                case Sign.SMALLER:
                                    return segSegDoIntersectCrossing(A2, A1, B2, B1);
                                case Sign.EQUAL:
                                    return true;
                                default:
                                    return segSegDoIntersectContained(A2, A1, B2, B1);
                            }
                        }
                    }
                }
                case Sign.EQUAL:
                    return true;
                default:
                    switch (xyCompare(B1, A2)) {
                        case Sign.SMALLER:
                            return false;
                        case Sign.EQUAL:
                            return true;
                        default: {
                            switch (xyCompare(B1, A1)) {
                                case Sign.SMALLER:
                                    return segSegDoIntersectCrossing(B2, B1, A2, A1);
                                case Sign.EQUAL:
                                    return true;
                                default:
                                    return segSegDoIntersectContained(B2, B1, A2, A1);
                            }
                        }
                    }
            }
        }
    }
}

function nextUp(x: number): number {
    if (x !== x) {
        return x;
    }
    if (x === -1 / 0) {
        return -Number.MAX_VALUE;
    }
    if (x === +1 / 0) {
        return +1 / 0;
    }
    if (x === +Number.MAX_VALUE) {
        return +1 / 0;
    }
    let y = x * (x < 0 ? 1 - Number.EPSILON / 2 : 1 + Number.EPSILON);
    if (y === x) {
        y = Number.MIN_VALUE * Number.EPSILON > 0 ? x + Number.MIN_VALUE * Number.EPSILON : x + Number.MIN_VALUE;
    }
    if (y === +1 / 0) {
        y = +Number.MAX_VALUE;
    }
    const b = x + (y - x) / 2;
    if (x < b && b < y) {
        y = b;
    }
    const c = (y + x) / 2;
    if (x < c && c < y) {
        y = c;
    }
    return y === 0 ? -0 : y;
}

export function ulp(x: number): number {
    return x < 0 ? nextUp(x) - x : x + nextUp(-x);
}

export function collinearInOrder(p: Point, q: Point, r: Point): boolean {
    if (xyCompare(p, q) !== Sign.LARGER && xyCompare(q, r) === Sign.LARGER) return false;
    if (xyCompare(p, q) !== Sign.SMALLER && xyCompare(q, r) === Sign.SMALLER) return false;
    return collinear(p, q, r);
}

export function collinear(p: Point, q: Point, r: Point): boolean {
    const surface = p[0] * (q[1] - r[1]) + q[0] * (r[1] - p[1]) + r[0] * (p[1] - q[1]);
    return surface > -0.0001 && surface < 0.0001;
}

export function rotateAroundOrigin(p: Point, angle: number): Point {
    const s = Math.sin(angle);
    const c = Math.cos(angle);
    return [p[0] * c - p[1] * s, p[0] * s + p[1] * c];
}

export function circleLineIntersection(
    circleCenter: GlobalPoint,
    circleRadius: number,
    A: GlobalPoint,
    B: GlobalPoint,
): GlobalPoint[] {
    const segmentRay = Ray.fromPoints(A, B); // d
    const circleLineRay = Ray.fromPoints(circleCenter, A); // f
    const a = segmentRay.direction.dot(segmentRay.direction);
    const b = 2 * circleLineRay.direction.dot(segmentRay.direction);
    const c = circleLineRay.direction.dot(circleLineRay.direction) - circleRadius ** 2;
    let d = b ** 2 - 4 * a * c;
    if (d < 0) return [];

    const intersectionPoints: GlobalPoint[] = [];

    d = Math.sqrt(d);
    const t1 = (-b - d) / (2 * a);
    const t2 = (-b + d) / (2 * a);
    if (t1 >= 0 && t1 <= 1) intersectionPoints.push(segmentRay.get(t1));
    if (t2 >= 0 && t2 <= 1) intersectionPoints.push(segmentRay.get(t2));
    return intersectionPoints;
}
