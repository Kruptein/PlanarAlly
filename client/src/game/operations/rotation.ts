import { sendShapePositionUpdate } from "../api/emits/shape/core";
import { GlobalPoint } from "../geom";
import { Shape } from "../shapes/shape";
import { visibilityStore } from "../visibility/store";
import { TriangulationTarget } from "../visibility/te/pa";

export function rotateShapes(
    shapes: readonly Shape[],
    deltaAngle: number,
    center: GlobalPoint,
    temporary: boolean,
): void {
    let recalculateMovement = false;
    let recalculateVision = false;

    for (const shape of shapes) {
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

        shape.rotateAround(center, deltaAngle);

        if (shape.movementObstruction && !temporary)
            visibilityStore.addToTriag({ target: TriangulationTarget.MOVEMENT, shape: shape.uuid });
        if (shape.visionObstruction)
            visibilityStore.addToTriag({ target: TriangulationTarget.VISION, shape: shape.uuid });

        if (!shape.preventSync) sendShapePositionUpdate([shape], temporary);
    }

    if (recalculateMovement) visibilityStore.recalculateMovement(shapes[0].floor.id);
    if (recalculateVision) visibilityStore.recalculateVision(shapes[0].floor.id);
    shapes[0].layer.invalidate(false);
}
