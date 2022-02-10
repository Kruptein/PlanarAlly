import type { GlobalPoint } from "../../core/geometry";
import { sendShapePositionUpdate } from "../api/emits/shape/core";
import type { IShape } from "../shapes/interfaces";
import { TriangulationTarget, visionState } from "../vision/state";

export function rotateShapes(
    shapes: readonly IShape[],
    deltaAngle: number,
    center: GlobalPoint,
    temporary: boolean,
): void {
    let recalculateMovement = false;
    let recalculateVision = false;

    for (const shape of shapes) {
        if (shape.blocksMovement && !temporary) {
            recalculateMovement = true;
            visionState.deleteFromTriangulation({
                target: TriangulationTarget.MOVEMENT,
                shape: shape.id,
            });
        }
        if (shape.blocksVision) {
            recalculateVision = true;
            visionState.deleteFromTriangulation({
                target: TriangulationTarget.VISION,
                shape: shape.id,
            });
        }

        shape.rotateAround(center, deltaAngle);

        if (shape.blocksMovement && !temporary)
            visionState.addToTriangulation({ target: TriangulationTarget.MOVEMENT, shape: shape.id });
        if (shape.blocksVision) visionState.addToTriangulation({ target: TriangulationTarget.VISION, shape: shape.id });

        if (!shape.preventSync) sendShapePositionUpdate([shape], temporary);
    }

    if (recalculateMovement) visionState.recalculateMovement(shapes[0].floor.id);
    if (recalculateVision) visionState.recalculateVision(shapes[0].floor.id);
    shapes[0].layer.invalidate(false);
}
