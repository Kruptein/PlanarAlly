import { GlobalPoint, Ray, Vector } from "@/game/geom";
import { layerManager } from "@/game/layers/manager";
import { Shape } from "@/game/shapes/shape";
import { visibilityStore } from "@/game/visibility/store";
import { getCDT, TriangulationTarget } from "@/game/visibility/te/pa";
import { Point, Sign, Triangle } from "@/game/visibility/te/tds";
import { ccw, cw, intersection, orientation } from "@/game/visibility/te/triag";
import { getBlockers } from "@/game/visibility/utils";

// First go through each shape in the selection and see if the delta has to be truncated due to movement blockers

// This is definitely super convoluted and inefficient but I was tired and really wanted the smooth wall sliding collision stuff to work
// And it does now, so hey ¯\_(ツ)_/¯
export function calculateDelta(delta: Vector, sel: Shape, done?: string[]): Vector {
    if (delta.x === 0 && delta.y === 0) return delta;
    if (visibilityStore.visionMode === "bvh") {
        if (done === undefined) done = [];
        const ogSelBBox = sel.getBoundingBox();
        const newSelBBox = ogSelBBox.offset(delta);
        let refine = false;
        for (const movementBlocker of getBlockers(TriangulationTarget.MOVEMENT, sel.floor)) {
            if (done.includes(movementBlocker)) continue;
            const blocker = layerManager.UUIDMap.get(movementBlocker)!;
            const blockerBBox = blocker.getBoundingBox();
            let found = blockerBBox.intersectsWithInner(newSelBBox);
            if (!found) {
                // This is an edge case, precalculating the rays is not worth in this case.
                const ray = Ray.fromPoints(ogSelBBox.topLeft.add(delta.normalize()), newSelBBox.topLeft);
                const invDir = ray.direction.inverse();
                const dirIsNegative = [invDir.x < 0, invDir.y < 0];
                found = blockerBBox.intersectP(ray, invDir, dirIsNegative).hit;
            }
            // Check if the bounding box of our destination would intersect with the bounding box of the movementblocker
            if (found) {
                const bCenter = blockerBBox.center();
                const sCenter = ogSelBBox.center();

                const d = sCenter.subtract(bCenter);
                const ux = new Vector(1, 0);
                const uy = new Vector(0, 1);
                let dx = d.dot(ux);
                let dy = d.dot(uy);
                if (dx > blockerBBox.w / 2) dx = blockerBBox.w / 2;
                if (dx < -blockerBBox.w / 2) dx = -blockerBBox.w / 2;
                if (dy > blockerBBox.h / 2) dy = blockerBBox.h / 2;
                if (dy < -blockerBBox.h / 2) dy = -blockerBBox.h / 2;

                // Closest point / intersection point between the two bboxes.  Not the delta intersect!
                const p = bCenter.add(ux.multiply(dx)).add(uy.multiply(dy));

                if (p.x === ogSelBBox.topLeft.x || p.x === ogSelBBox.topRight.x) delta = new Vector(0, delta.y);
                else if (p.y === ogSelBBox.topLeft.y || p.y === ogSelBBox.botLeft.y) delta = new Vector(delta.x, 0);
                else {
                    if (p.x < ogSelBBox.topLeft.x) delta = new Vector(p.x - ogSelBBox.topLeft.x, delta.y);
                    else if (p.x > ogSelBBox.topRight.x) delta = new Vector(p.x - ogSelBBox.topRight.x, delta.y);
                    else if (p.y < ogSelBBox.topLeft.y) delta = new Vector(delta.x, p.y - ogSelBBox.topLeft.y);
                    else if (p.y > ogSelBBox.botLeft.y) delta = new Vector(delta.x, p.y - ogSelBBox.botLeft.y);
                }
                refine = true;
                done.push(movementBlocker);
                break;
            }
        }
        if (refine) delta = calculateDelta(delta, sel, done);
        return delta;
    } else {
        const centerTriangle = getCDT(TriangulationTarget.MOVEMENT, sel.floor).locate(sel.center().asArray(), null).loc;
        for (const point of sel.points) {
            const lt = getCDT(TriangulationTarget.MOVEMENT, sel.floor).locate(point, centerTriangle);
            const triangle = lt.loc;
            if (triangle === null) continue;
            delta = checkTriangle(point, triangle, delta);
        }
        return delta;
    }
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
