import type { DeepReadonly } from "vue";

import type { ILayer } from "../game/interfaces/layer";
import type { IShape } from "../game/interfaces/shape";

import { l2gz } from "./conversions";
import { equalsP, subtractP, toArrayP, toGP, Vector } from "./geometry";
import type { GlobalPoint } from "./geometry";

export function equalPoint(a: number, b: number, delta = 0.0001): boolean {
    return a - delta < b && a + delta > b;
}

export function equalPoints(a: [number, number], b: [number, number], delta = 0.0001): boolean {
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

export function getClosestPoint(
    inputPoint: GlobalPoint,
    points: GlobalPoint[],
    snapDistance?: number,
): [GlobalPoint, boolean] {
    snapDistance ??= l2gz(20);
    let smallestPoint: [number, GlobalPoint] | undefined;
    for (const point of points) {
        const l = subtractP(inputPoint, point).length();

        if (l < (smallestPoint?.[0] ?? snapDistance)) {
            smallestPoint = [l, point];
        }
    }
    if (smallestPoint !== undefined) return [smallestPoint[1], true];
    return [inputPoint, false];
}

export function snapToPoint(
    layer: DeepReadonly<ILayer>,
    endPoint: GlobalPoint,
    ignore?: { shape: IShape; pointIndex?: number },
): [GlobalPoint, boolean] {
    const snapDistance = l2gz(20);
    let smallestPoint: [number, GlobalPoint] | undefined;
    // We could do an extra cache in Layer, similar to Shape._points if this ends up being too slow
    // Has to be tested in scenes with a lot of shapes
    for (const shape of layer.getShapes({ onlyInView: true })) {
        if (!shape.isSnappable) continue;
        for (const point of shape.points) {
            // const gp = toGP(JSON.parse(point) as [number, number]);
            const gp = toGP(point);
            if (ignore?.shape.id === shape.id) {
                if (ignore.pointIndex === undefined) continue;
                const ignorePoint = toGP(ignore.shape.points[ignore.pointIndex]!);
                if (equalsP(gp, ignorePoint)) continue;
            }
            const l = subtractP(endPoint, gp).length();

            if (l < (smallestPoint?.[0] ?? snapDistance)) {
                smallestPoint = [l, gp];
            }
        }
    }
    if (smallestPoint !== undefined) endPoint = smallestPoint[1];
    return [endPoint, smallestPoint !== undefined];
}
