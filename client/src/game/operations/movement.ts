import { addP, toArrayP } from "../../core/geometry";
import type { Vector } from "../../core/geometry";
import { sendShapePositionUpdate } from "../api/emits/shape/core";
import { moveClient } from "../client";
import { selectionState } from "../layers/selection";
import type { IShape } from "../shapes/interfaces";
import { teleportZoneSystem } from "../systems/logic/teleportZone";
import { TriangulationTarget, visionState } from "../vision/state";

import type { MovementOperation, ShapeMovementOperation } from "./model";
import { addOperation } from "./undo";

export async function moveShapes(shapes: readonly IShape[], delta: Vector, temporary: boolean): Promise<void> {
    let recalculateMovement = false;
    let recalculateVision = false;

    const updateList = [];
    const operationList: MovementOperation = { type: "movement", shapes: [] };

    for (const shape of shapes) {
        if (!shape.ownedBy(false, { movementAccess: true })) continue;

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

        const operation: ShapeMovementOperation = {
            uuid: shape.id,
            from: toArrayP(shape.refPoint),
            to: toArrayP(shape.refPoint),
        };

        shape.refPoint = addP(shape.refPoint, delta);

        operation.to = toArrayP(shape.refPoint);
        operationList.shapes.push(operation);

        if (shape.blocksMovement && !temporary)
            visionState.addToTriangulation({ target: TriangulationTarget.MOVEMENT, shape: shape.id });
        if (shape.blocksVision) visionState.addToTriangulation({ target: TriangulationTarget.VISION, shape: shape.id });

        // todo: Fix again
        // if (sel.refPoint.x % gridSize !== 0 || sel.refPoint.y % gridSize !== 0) sel.snapToGrid();
        if (!shape.preventSync) updateList.push(shape);
        if (shape.options.isPlayerRect ?? false) {
            moveClient(shape.id);
        }
    }

    sendShapePositionUpdate(updateList, temporary);
    if (!temporary) {
        addOperation(operationList);

        await teleportZoneSystem.checkTeleport(selectionState.get({ includeComposites: true }));
    }

    const floorId = shapes[0].floor.id;
    if (recalculateVision) visionState.recalculateVision(floorId);
    if (recalculateMovement) visionState.recalculateMovement(floorId);
    shapes[0].layer.invalidate(false);
}
