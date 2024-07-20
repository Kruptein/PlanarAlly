import type { GlobalPoint } from "../../core/geometry";
import { sendShapeSizeUpdate } from "../api/emits/shape/core";
import type { IShape } from "../interfaces/shape";
import { getProperties } from "../systems/properties/state";
import { VisionBlock } from "../systems/properties/types";
import { TriangulationTarget, visionState } from "../vision/state";

export function resizeShape(
    shape: IShape,
    targetPoint: GlobalPoint,
    resizePoint: number,
    retainAspectRatio: boolean,
    temporary: boolean,
): number {
    let recalculateMovement = false;
    let recalculateVision = false;

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

    const newResizePoint = shape.resize(resizePoint, targetPoint, retainAspectRatio);

    // todo: think about calling deleteIntersectVertex directly on the corner point
    if (props.blocksMovement && !temporary)
        visionState.addToTriangulation({ target: TriangulationTarget.MOVEMENT, shape: shape.id });
    if (props.blocksVision !== VisionBlock.No)
        visionState.addToTriangulation({ target: TriangulationTarget.VISION, shape: shape.id });

    if (!shape.preventSync) sendShapeSizeUpdate({ shape, temporary });

    const layer = shape.layer;
    if (layer !== undefined) {
        if (recalculateMovement) visionState.recalculateMovement(layer.floor);
        if (recalculateVision) visionState.recalculateVision(layer.floor);
        layer.invalidate(false);
    }

    return newResizePoint;
}
