import layerManager from "../../layers/manager";
import Shape from "../../shapes/shape";

import { Ray, Vector } from "../../geom";

import { store } from "../../store";

// First go through each shape in the selection and see if the delta has to be truncated due to movement blockers

// This is definitely super convoluted and inefficient but I was tired and really wanted the smooth wall sliding collision stuff to work
// And it does now, so hey ¯\_(ツ)_/¯
export function calculateDelta(delta: Vector, sel: Shape, done?: string[]) {
    if (done === undefined) done = [];
    const ogSelBBox = sel.getBoundingBox();
    const newSelBBox = ogSelBBox.offset(delta);
    let refine = false;
    for (const movementBlocker of store.movementblockers) {
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
}
