import type { GlobalPoint } from "../../core/geometry";
import { sendShapeSizeUpdate } from "../api/emits/shape/core";
import type { IShape } from "../interfaces/shape";
import { getProperties } from "../systems/properties/state";
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
    if (props.blocksVision) {
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
    if (props.blocksVision) visionState.addToTriangulation({ target: TriangulationTarget.VISION, shape: shape.id });

    if (!shape.preventSync) sendShapeSizeUpdate({ shape, temporary });

    if (recalculateMovement) visionState.recalculateMovement(shape.floor.id);
    if (recalculateVision) visionState.recalculateVision(shape.floor.id);
    shape.layer.invalidate(false);

    return newResizePoint;
}
