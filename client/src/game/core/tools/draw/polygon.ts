import { InvalidationMode, SyncMode } from "../../../../core/models/types";
import { sendShapeSizeUpdate } from "../../api/emits/shape/core";
import type { ILayer } from "../../interfaces/layer";
import type { IShape } from "../../interfaces/shape";
import { Line } from "../../shapes/variants/line";
import { getProperties } from "../../systems/properties/state";
import { TriangulationTarget, visionState } from "../../vision/state";

import { drawBrush } from "./brush";
import { drawCoreState } from "./state";

interface DrawPolygonState {
    ruler: Line | undefined;
}

const state: DrawPolygonState = {
    ruler: undefined,
};

function onDown(shape: IShape, layer: ILayer): void {
    const lastPoint = drawBrush.getPosition();
    if (state.ruler === undefined) {
        state.ruler = new Line(
            lastPoint,
            lastPoint,
            {
                lineWidth: drawCoreState.ui.brushSize,
                isSnappable: false,
            },
            { strokeColour: [drawCoreState.ui.fillColour] },
        );
        layer.addShape(state.ruler, SyncMode.NO_SYNC, InvalidationMode.NORMAL);
    } else {
        state.ruler.refPoint = lastPoint;
        state.ruler.endPoint = lastPoint;
    }
    const points = shape.points; // expensive call
    const props = getProperties(shape.id)!;
    if (props.blocksVision && points.length > 1)
        visionState.insertConstraint(TriangulationTarget.VISION, shape, points.at(-2)!, points.at(-1)!);
    if (props.blocksMovement && points.length > 1)
        visionState.insertConstraint(TriangulationTarget.MOVEMENT, shape, points.at(-2)!, points.at(-1)!);
    layer.invalidate(false);
    if (!shape.preventSync) sendShapeSizeUpdate({ shape, temporary: true });
}

export const drawPolygon = {
    onDown,
};
