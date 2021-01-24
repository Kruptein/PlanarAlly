import { sendShapeSizeUpdate } from "../api/emits/shape/core";
import { GlobalPoint } from "../geom";
import { Shape } from "../shapes/shape";
import { visibilityStore } from "../visibility/store";
import { TriangulationTarget } from "../visibility/te/pa";

export function resizeShape(
    shape: Shape,
    targetPoint: GlobalPoint,
    resizePoint: number,
    retainAspectRatio: boolean,
    temporary: boolean,
): number {
    let recalculateMovement = false;
    let recalculateVision = false;

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

    const newResizePoint = shape.resize(resizePoint, targetPoint, retainAspectRatio);

    // todo: think about calling deleteIntersectVertex directly on the corner point
    if (shape.movementObstruction && !temporary)
        visibilityStore.addToTriag({ target: TriangulationTarget.MOVEMENT, shape: shape.uuid });
    if (shape.visionObstruction) visibilityStore.addToTriag({ target: TriangulationTarget.VISION, shape: shape.uuid });

    if (!shape.preventSync) sendShapeSizeUpdate({ shape, temporary });

    if (recalculateMovement) visibilityStore.recalculateMovement(shape.floor.id);
    if (recalculateVision) visibilityStore.recalculateVision(shape.floor.id);
    shape.layer.invalidate(false);

    return newResizePoint;
}
