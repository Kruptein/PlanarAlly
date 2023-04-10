import { g2l, g2lx, g2ly } from "../../../../core/conversions";
import type { LocalPoint } from "../../../../core/geometry";
import { Vector, toLP, Ray, toArrayP } from "../../../../core/geometry";
import type { PressedModifiers } from "../../../common/events";
import { SelectFeatures } from "../../../dom/tools/models/select";
import { sendShapePositionUpdate } from "../../api/emits/shape/core";
import { calculateDelta } from "../../drag";
import type { IShape } from "../../interfaces/shape";
import { LayerName } from "../../models/floor";
import type { ToolFeatures } from "../../models/tools";
import { moveShapes } from "../../operations/movement";
import { accessSystem } from "../../systems/access";
import { floorState } from "../../systems/floors/state";
import { gameState } from "../../systems/game/state";
import { teleportZoneSystem } from "../../systems/logic/tp";
import { positionState } from "../../systems/position/state";
import { getProperties } from "../../systems/properties/state";
import { selectedSystem } from "../../systems/selected";
import { locationSettingsState } from "../../systems/settings/location/state";
import { playerSettingsState } from "../../systems/settings/players/state";
import { TriangulationTarget, visionState } from "../../vision/state";
import { hasFeature } from "../feature";

import { selectRotation } from "./rotation";
import { SelectOperations, selectCoreState } from "./state";

interface DragState {
    // Because we never drag from the asset's (0, 0) coord and want a smoother drag experience
    // we keep track of the actual offset within the asset.
    ray: Ray<LocalPoint>;
}

const state: DragState = {
    ray: new Ray<LocalPoint>(toLP(0, 0), new Vector(0, 0)),
};

function onDown(lp: LocalPoint, shape: IShape, blocksMovement: boolean, features: ToolFeatures<SelectFeatures>): void {
    if (!hasFeature(SelectFeatures.Drag, features)) return;

    selectCoreState.mode = SelectOperations.Drag;
    const localRefPoint = g2l(shape.refPoint);
    state.ray = Ray.fromPoints(localRefPoint, lp);
    selectCoreState.operationList = { type: "movement", shapes: [] };

    for (const shape of selectedSystem.get({ includeComposites: false })) {
        selectCoreState.operationList.shapes.push({
            uuid: shape.id,
            from: toArrayP(shape.refPoint),
            to: toArrayP(shape.refPoint),
        });
        if (blocksMovement && shape.layerName === LayerName.Tokens) {
            if (shape.floorId !== undefined)
                visionState.removeBlocker(TriangulationTarget.MOVEMENT, shape.floorId, shape, true);
        }
    }
}

async function onMove(
    lp: LocalPoint,
    layerSelection: readonly IShape[],
    shiftPressed: boolean | undefined,
    features: ToolFeatures<SelectFeatures>,
): Promise<void> {
    let deltaChanged = false;

    let delta = Ray.fromPoints(state.ray.get(state.ray.tMax), lp).direction.multiply(1 / positionState.readonly.zoom);
    const ogDelta = delta;
    if (ogDelta.length() === 0) return;

    const layer = floorState.readonly.currentLayer;
    // If we are on the tokens layer do a movement block check.
    if (layer?.name === "tokens" && !((shiftPressed ?? false) && gameState.raw.isDm)) {
        for (const sel of layerSelection) {
            if (!accessSystem.hasAccessTo(sel.id, false, { movement: true })) continue;
            delta = calculateDelta(delta, sel, true);
            if (delta !== ogDelta) deltaChanged = true;
        }
    }
    await moveShapes(layerSelection, delta, true);
    if (!deltaChanged) {
        // Our mouse position changed, but the distance between our shape did not actually move
        // We hit something like a wall, which means our local position in the shape needs to be updated
        state.ray = Ray.fromPoints(state.ray.origin, lp);
    }
    selectRotation.updateUi(features);
    // if (hasFeature(SelectFeatures.PolygonEdit, features)) {
    //     this.updatePolygonEditUi(l2g(lp));
    // }
    layer?.invalidate(false);
}

async function onUp(
    layerSelection: readonly IShape[],
    pressed: PressedModifiers | undefined,
    features: ToolFeatures<SelectFeatures>,
): Promise<{ recalcVision: boolean; recalcMovement: boolean }> {
    const updateList = [];
    let recalcVision = false;
    let recalcMovement = false;
    for (const [s, sel] of layerSelection.entries()) {
        if (!accessSystem.hasAccessTo(sel.id, false, { movement: true })) continue;
        if (state.ray.origin.x === g2lx(sel.refPoint.x) && state.ray.origin.y === g2ly(sel.refPoint.y)) continue;
        const props = getProperties(sel.id)!;
        // movementBlock is skipped during onMove and definitely has to be done here
        if (props.blocksMovement) {
            visionState.deleteFromTriangulation({
                target: TriangulationTarget.MOVEMENT,
                shape: sel.id,
            });
        }
        if (
            pressed &&
            locationSettingsState.raw.useGrid.value &&
            playerSettingsState.useSnapping(pressed.alt) &&
            hasFeature(SelectFeatures.Snapping, features)
        ) {
            if (props.blocksVision) {
                visionState.deleteFromTriangulation({
                    target: TriangulationTarget.VISION,
                    shape: sel.id,
                });
            }
            sel.snapToGrid();
            if (props.blocksVision) {
                visionState.addToTriangulation({ target: TriangulationTarget.VISION, shape: sel.id });
                recalcVision = true;
            }
        }
        // movementBlock is skipped during onMove and definitely has to be done here
        if (props.blocksMovement) {
            if (sel.layerName === LayerName.Tokens) {
                if (sel.floorId !== undefined)
                    visionState.addBlocker(TriangulationTarget.MOVEMENT, sel.id, sel.floorId, false);
            }
            visionState.addToTriangulation({ target: TriangulationTarget.MOVEMENT, shape: sel.id });
            recalcMovement = true;
        }
        if (selectCoreState.operationList?.type === "movement" && s < selectCoreState.operationList.shapes.length) {
            selectCoreState.operationList.shapes[s]!.to = toArrayP(sel.refPoint);
            selectCoreState.operationReady = true;
        }
        if (props.blocksVision) recalcVision = true;
        if (props.blocksMovement) recalcMovement = true;
        if (!sel.preventSync) updateList.push(sel);
    }
    sendShapePositionUpdate(updateList, false);
    await teleportZoneSystem.checkTeleport(selectedSystem.get({ includeComposites: true }));
    return { recalcVision, recalcMovement };
}

export const selectDrag = {
    onDown,
    onMove,
    onUp,
};
