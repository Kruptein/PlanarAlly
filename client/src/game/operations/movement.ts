import { sendShapePositionUpdate } from "../api/emits/shape/core";
import { Vector } from "../geom";
import { Shape } from "../shapes/shape";
import { visibilityStore } from "../visibility/store";
import { TriangulationTarget } from "../visibility/te/pa";
export function moveShapes(shapes: readonly Shape[], delta: Vector, temporary: boolean): void {
    let recalculateMovement = false;
    let recalculateVision = false;


    for (const shape of shapes) {
        if (!shape.ownedBy(false, { movementAccess: true })) continue;

        if (shape.movementObstruction && !temporary) {
            recalculateMovement = true;
            visibilityStore.deleteFromTriag({
                target: TriangulationTarget.MOVEMENT,
                shape: shape.uuid,
            });
        }
        if (shape.visionObstruction) {
            recalculateVision = true;
            visibilityStore.deleteFromTriag({
                target: TriangulationTarget.VISION,
                shape: shape.uuid,
            });
        }

        shape.refPoint = shape.refPoint.add(delta);

        if (shape.movementObstruction && !temporary)
            visibilityStore.addToTriag({ target: TriangulationTarget.MOVEMENT, shape: shape.uuid });
        if (shape.visionObstruction)
            visibilityStore.addToTriag({ target: TriangulationTarget.VISION, shape: shape.uuid });
        // todo: Fix again
        // if (sel.refPoint.x % gridSize !== 0 || sel.refPoint.y % gridSize !== 0) sel.snapToGrid();
        if (!shape.preventSync) updateList.push(shape);
    }
    sendShapePositionUpdate(updateList, temporary);

    const floorId = shapes[0].floor.id;
    if (recalculateVision) visibilityStore.recalculateVision(floorId);
    if (recalculateMovement) visibilityStore.recalculateMovement(floorId);
    shapes[0].layer.invalidate(false);
