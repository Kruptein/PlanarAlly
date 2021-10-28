import type { Layer } from "../game/layers/variants/layer";
import { DEFAULT_GRID_SIZE } from "../store/client";

import { l2gz } from "./conversions";
import { addP, equalsP, subtractP, toArrayP, toGP, Vector } from "./geometry";
import type { GlobalPoint } from "./geometry";

export function equalPoint(a: number, b: number, delta = 0.0001): boolean {
    return a - delta < b && a + delta > b;
}

export function equalPoints(a: number[], b: number[], delta = 0.0001): boolean {
    return equalPoint(a[0], b[0], delta) && equalPoint(a[1], b[1], delta);
}

export function rotateAroundPoint(point: GlobalPoint, center: GlobalPoint, angle: number): GlobalPoint {
    if (angle === 0) return point;
    if (equalPoints(toArrayP(center), toArrayP(point))) return point;

    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return toGP(
        c * (point.x - center.x) - s * (point.y - center.y) + center.x,
        s * (point.x - center.x) + c * (point.y - center.y) + center.y,
    );
}

export function filterEqualPoints(points: GlobalPoint[]): GlobalPoint[] {
    return points.filter((val, i, arr) => arr.findIndex((t) => equalsP(t, val)) === i);
}

export function getPointsCenter(points: GlobalPoint[]): GlobalPoint {
    const vertexAvg = points
        .reduce((acc: Vector, val: GlobalPoint) => acc.add(new Vector(val.x, val.y)), new Vector(0, 0))
        .multiply(1 / points.length);
    return toGP(vertexAvg.asArray());
}

export function snapToPoint(layer: Layer, endPoint: GlobalPoint, ignore?: GlobalPoint): [GlobalPoint, boolean] {
    const snapDistance = l2gz(20);
    let smallestPoint: [number, GlobalPoint] | undefined;
    for (const point of layer.points.keys()) {
        const gp = toGP(JSON.parse(point));
        if (ignore && equalsP(gp, ignore)) continue;
        const l = subtractP(endPoint, gp).length();

        if (l < (smallestPoint?.[0] ?? snapDistance)) smallestPoint = [l, gp];
    }
    if (smallestPoint !== undefined) endPoint = smallestPoint[1];
    return [endPoint, smallestPoint !== undefined];
}

export function snapToGridPoint(point: GlobalPoint): [GlobalPoint, boolean] {
    let smallestPoint: [number, GlobalPoint] | undefined;
    const reverseOriginVector = new Vector(
        Math.floor(point.x / DEFAULT_GRID_SIZE) * DEFAULT_GRID_SIZE,
        Math.floor(point.y / DEFAULT_GRID_SIZE) * DEFAULT_GRID_SIZE,
    );
    let originShifted = toGP(point.x % DEFAULT_GRID_SIZE, point.y % DEFAULT_GRID_SIZE);
    if (originShifted.x < 0) originShifted = addP(originShifted, new Vector(DEFAULT_GRID_SIZE, 0));
    if (originShifted.y < 0) originShifted = addP(originShifted, new Vector(0, DEFAULT_GRID_SIZE));

    const targets = [
        toGP(0, 0),
        toGP(0, DEFAULT_GRID_SIZE),
        toGP(DEFAULT_GRID_SIZE, 0),
        toGP(DEFAULT_GRID_SIZE, DEFAULT_GRID_SIZE),
        toGP(0, DEFAULT_GRID_SIZE / 2),
        toGP(DEFAULT_GRID_SIZE / 2, 0),
        toGP(DEFAULT_GRID_SIZE, DEFAULT_GRID_SIZE / 2),
        toGP(DEFAULT_GRID_SIZE / 2, DEFAULT_GRID_SIZE),
        toGP(DEFAULT_GRID_SIZE / 2, DEFAULT_GRID_SIZE / 2),
    ];
    for (const target of targets) {
        const l = subtractP(originShifted, target).length();

        if (l < (smallestPoint?.[0] ?? Number.MAX_VALUE)) smallestPoint = [l, target];
    }
    if (smallestPoint !== undefined) return [addP(smallestPoint[1], reverseOriginVector), true];
    return [point, false];
}
