import type { GlobalPoint } from "../../core/geometry";
import { sendShapePositionUpdate } from "../api/emits/shape/core";
import type { IShape } from "../interfaces/shape";
import { getProperties } from "../systems/properties/state";
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
        const props = getProperties(shape.id)!;
        if (props.blocksMovement && !temporary) {
            recalculateMovement = true;
            visionState.deleteFromTriangulation({
                target: TriangulationTarget.MOVEMENT,
                shape: shape.id,
            });
        }
        if (props.blocksVision) {
            recalculateVision = true;
            visionState.deleteFromTriangulation({
                target: TriangulationTarget.VISION,
                shape: shape.id,
            });
        }

        shape.rotateAround(center, deltaAngle);

        if (props.blocksMovement && !temporary)
            visionState.addToTriangulation({ target: TriangulationTarget.MOVEMENT, shape: shape.id });
        if (props.blocksVision) visionState.addToTriangulation({ target: TriangulationTarget.VISION, shape: shape.id });

        if (!shape.preventSync) sendShapePositionUpdate([shape], temporary);
    }

    if (recalculateMovement) visionState.recalculateMovement(shapes[0].floor.id);
    if (recalculateVision) visionState.recalculateVision(shapes[0].floor.id);
    shapes[0].layer.invalidate(false);
}
