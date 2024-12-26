import { addP, toArrayP } from "../../core/geometry";
import type { Vector } from "../../core/geometry";
import type { LocalId } from "../../core/id";
import { sendShapePositionUpdate } from "../api/emits/shape/core";
import { getShape } from "../id";
import type { IShape } from "../interfaces/shape";
import { accessSystem } from "../systems/access";
import { clientSystem } from "../systems/client";
import { gameState } from "../systems/game/state";
import { teleportZoneSystem } from "../systems/logic/tp";
import { getProperties } from "../systems/properties/state";
import { VisionBlock } from "../systems/properties/types";
import { selectedSystem } from "../systems/selected";
import { locationSettingsState } from "../systems/settings/location/state";
import { initiativeStore } from "../ui/initiative/state";
import { TriangulationTarget, visionState } from "../vision/state";

import type { MovementOperation, ShapeMovementOperation } from "./model";
import { addOperation } from "./undo";

/**
 * Move the provided shapes in the provided direction.
 * It is implicitly assumed that all shapes provided are on the same layer.
 *
 * @param shapes A list of shapes all belonging to the same layer
 * @param delta The direction in which the shapes should be moved
 * @param temporary Flag to indicate near-future override
 */
export async function moveShapes(shapes: readonly IShape[], delta: Vector, temporary: boolean): Promise<void> {
    if (shapes.length === 0) return;

    let recalculateMovement = false;
    let recalculateVision = false;

    const updateList = [];
    const operationList: MovementOperation = { type: "movement", shapes: [] };

    for (const shape of shapes) {
        if (!canMove(shape.id)) continue;
        const props = getProperties(shape.id);
        if (props === undefined) continue;

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

        const operation: ShapeMovementOperation = {
            uuid: shape.id,
            from: toArrayP(shape.refPoint),
            to: toArrayP(shape.refPoint),
        };

        shape.refPoint = addP(shape.refPoint, delta);

        for (const [collapsedId] of shape.options.collapsedIds ?? []) {
            const collapsedShape = getShape(collapsedId);
            if (collapsedShape === undefined) continue;
            collapsedShape.center = shape.center;
            if (!collapsedShape.preventSync) updateList.push(collapsedShape);
        }

        operation.to = toArrayP(shape.refPoint);
        operationList.shapes.push(operation);

        if (props.blocksMovement && !temporary)
            visionState.addToTriangulation({ target: TriangulationTarget.MOVEMENT, shape: shape.id });
        if (props.blocksVision !== VisionBlock.No)
            visionState.addToTriangulation({ target: TriangulationTarget.VISION, shape: shape.id });

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

    const layer = shapes[0]?.layer;
    if (layer !== undefined) {
        if (recalculateVision) visionState.recalculateVision(layer.floor);
        if (recalculateMovement) visionState.recalculateMovement(layer.floor);
        layer.invalidate(false);
    }
}

function canMove(shapeId: LocalId): boolean {
    if (!accessSystem.hasAccessTo(shapeId, false, { movement: true })) return false;
    if (!locationSettingsState.raw.limitMovementDuringInitiative.value) return true;
    if (!initiativeStore.state.isActive) return true;
    if (gameState.raw.isDm) return true;
    return initiativeStore.getActor()?.localId === shapeId;
}
