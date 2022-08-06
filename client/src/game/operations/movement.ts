import { addP, toArrayP } from "../../core/geometry";
import type { Vector } from "../../core/geometry";
import { sendShapePositionUpdate } from "../api/emits/shape/core";
import type { IShape } from "../interfaces/shape";
import { accessSystem } from "../systems/access";
import { clientSystem } from "../systems/client";
import { teleportZoneSystem } from "../systems/logic/tp";
import { getProperties } from "../systems/properties/state";
import { selectedSystem } from "../systems/selected";
import { TriangulationTarget, visionState } from "../vision/state";

import type { MovementOperation, ShapeMovementOperation } from "./model";
import { addOperation } from "./undo";

export async function moveShapes(shapes: readonly IShape[], delta: Vector, temporary: boolean): Promise<void> {
    let recalculateMovement = false;
    let recalculateVision = false;

    const updateList = [];
    const operationList: MovementOperation = { type: "movement", shapes: [] };

    for (const shape of shapes) {
        if (!accessSystem.hasAccessTo(shape.id, false, { movement: true })) continue;
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

        const operation: ShapeMovementOperation = {
            uuid: shape.id,
            from: toArrayP(shape.refPoint),
            to: toArrayP(shape.refPoint),
        };

        shape.refPoint = addP(shape.refPoint, delta);

        operation.to = toArrayP(shape.refPoint);
        operationList.shapes.push(operation);

        if (props.blocksMovement && !temporary)
            visionState.addToTriangulation({ target: TriangulationTarget.MOVEMENT, shape: shape.id });
        if (props.blocksVision) visionState.addToTriangulation({ target: TriangulationTarget.VISION, shape: shape.id });

        // todo: Fix again
        // if (sel.refPoint.x % gridSize !== 0 || sel.refPoint.y % gridSize !== 0) sel.snapToGrid();
        if (!shape.preventSync) updateList.push(shape);
        if (shape.options.isPlayerRect ?? false) {
            clientSystem.moveClient(shape.id);
        }
    }

    sendShapePositionUpdate(updateList, temporary);
    if (!temporary) {
        addOperation(operationList);

        await teleportZoneSystem.checkTeleport(selectedSystem.get({ includeComposites: true }));
    }

    const floorId = shapes[0].floor.id;
    if (recalculateVision) visionState.recalculateVision(floorId);
    if (recalculateMovement) visionState.recalculateMovement(floorId);
    shapes[0].layer.invalidate(false);
}
