import type { GlobalPoint } from "../../core/geometry";
import { sendShapePositionUpdate } from "../api/emits/shape/core";
import type { IShape } from "../interfaces/shape";
import { getProperties } from "../systems/properties/state";
import { VisionBlock } from "../systems/properties/types";
import { TriangulationTarget, visionState } from "../vision/state";

export function rotateShapes(
    shapes: readonly IShape[],
    deltaAngle: number,
    center: GlobalPoint,
    temporary: boolean,
): void {
    if (shapes.length === 0) return;

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
        if (props.blocksVision !== VisionBlock.No) {
            recalculateVision = true;
            visionState.deleteFromTriangulation({
                target: TriangulationTarget.VISION,
                shape: shape.id,
            });
        }

        shape.rotateAround(center, deltaAngle);

        if (props.blocksMovement && !temporary)
            visionState.addToTriangulation({ target: TriangulationTarget.MOVEMENT, shape: shape.id });
        if (props.blocksVision !== VisionBlock.No)
            visionState.addToTriangulation({ target: TriangulationTarget.VISION, shape: shape.id });

        if (!shape.preventSync) sendShapePositionUpdate([shape], temporary);
    }

    const layer = shapes[0]?.layer;
    if (layer !== undefined) {
        if (recalculateMovement) visionState.recalculateMovement(layer.floor);
        if (recalculateVision) visionState.recalculateVision(layer.floor);
        layer.invalidate(false);
    }
}
