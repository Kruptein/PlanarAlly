import { l2gz } from "../../../../core/conversions";
import type { GlobalPoint } from "../../../../core/geometry";
import { toGP } from "../../../../core/geometry";
import { snapToPoint } from "../../../../core/math";
import { ctrlOrCmdPressed } from "../../../../core/utils";
import type { PressedModifiers } from "../../../common/events";
import { SelectFeatures } from "../../../dom/tools/models/select";
import { sendShapeSizeUpdate } from "../../api/emits/shape/core";
import type { IShape } from "../../interfaces/shape";
import type { ToolFeatures } from "../../models/tools";
import { resizeShape } from "../../operations/resize";
import { accessSystem } from "../../systems/access";
import { floorState } from "../../systems/floors/state";
import { getProperties } from "../../systems/properties/state";
import { selectedSystem } from "../../systems/selected";
import { locationSettingsState } from "../../systems/settings/location/state";
import { playerSettingsState } from "../../systems/settings/players/state";
import { TriangulationTarget, visionState } from "../../vision/state";
import { hasFeature } from "../feature";

import { selectCursor } from "./cursor";
import { selectRotation } from "./rotation";
import { SelectOperations, selectCoreState } from "./state";

interface ResizeState {
    point: number;
    originalPoints: [number, number][];
}

const state: ResizeState = {
    point: 0,
    originalPoints: [],
};

function onDown(gp: GlobalPoint, shape: IShape, features: ToolFeatures<SelectFeatures>): boolean {
    if (!hasFeature(SelectFeatures.Resize, features)) return false;

    state.point = shape.getPointIndex(gp, l2gz(5));
    if (state.point >= 0) {
        const layer = floorState.readonly.currentLayer!;
        // Resize case, a corner is selected
        selectedSystem.set(shape.id);
        // removeRotationUi();
        selectRotation.createUi(features);
        const points = shape.points; // expensive call
        state.originalPoints = points;
        selectCoreState.mode = SelectOperations.Resize;
        layer.invalidate(true);
        const targetPoint = points[state.point];
        if (targetPoint !== undefined) {
            selectCoreState.operationList = {
                type: "resize",
                uuid: shape.id,
                fromPoint: targetPoint,
                toPoint: targetPoint,
                resizePoint: state.point,
                retainAspectRatio: false,
            };
        }
        return true;
    }
    return false;
}

function onMove(
    gp: GlobalPoint,
    shape: IShape,
    pressed: PressedModifiers | undefined,
    features: ToolFeatures<SelectFeatures>,
): void {
    if (!accessSystem.hasAccessTo(shape.id, false, { movement: true })) return;

    let ignorePoint: GlobalPoint | undefined;
    if (state.point >= 0) {
        const targetPoint = state.originalPoints[state.point];
        if (targetPoint !== undefined) ignorePoint = toGP(targetPoint);
    }
    let targetPoint = gp;
    if (hasFeature(SelectFeatures.Snapping, features) && pressed && playerSettingsState.useSnapping(pressed.alt)) {
        targetPoint = snapToPoint(floorState.readonly.currentLayer!, gp, ignorePoint)[0];
    }

    state.point = resizeShape(shape, targetPoint, state.point, ctrlOrCmdPressed(pressed), true);
    selectCursor.updateCursor(gp, features);
}

function onUp(
    layerSelection: readonly IShape[],
    pressed: PressedModifiers | undefined,
    features: ToolFeatures<SelectFeatures>,
): { recalcVision: boolean; recalcMovement: boolean } {
    let recalcVision = false;
    let recalcMovement = false;

    for (const sel of layerSelection) {
        if (!accessSystem.hasAccessTo(sel.id, false, { movement: true })) continue;

        const props = getProperties(sel.id)!;
        // movementBlock is skipped during onMove and definitely has to be done here
        if (props.blocksMovement)
            visionState.deleteFromTriangulation({
                target: TriangulationTarget.MOVEMENT,
                shape: sel.id,
            });
        if (
            pressed &&
            locationSettingsState.raw.useGrid.value &&
            playerSettingsState.useSnapping(pressed.alt) &&
            hasFeature(SelectFeatures.Snapping, features)
        ) {
            if (props.blocksVision)
                visionState.deleteFromTriangulation({
                    target: TriangulationTarget.VISION,
                    shape: sel.id,
                });
            sel.resizeToGrid(state.point, ctrlOrCmdPressed(pressed));
            if (props.blocksVision) {
                visionState.addToTriangulation({ target: TriangulationTarget.VISION, shape: sel.id });
                recalcVision = true;
            }
        }
        // movementBlock is skipped during onMove and definitely has to be done here
        if (props.blocksMovement) {
            visionState.addToTriangulation({ target: TriangulationTarget.MOVEMENT, shape: sel.id });
            recalcMovement = true;
        }
        if (!sel.preventSync) {
            sendShapeSizeUpdate({ shape: sel, temporary: false });
        }
        if (selectCoreState.operationList?.type === "resize" && state.point < sel.points.length) {
            selectCoreState.operationList.toPoint = sel.points[state.point]!;
            selectCoreState.operationList.resizePoint = state.point;
            selectCoreState.operationList.retainAspectRatio = ctrlOrCmdPressed(pressed);
            selectCoreState.operationReady = true;
        }
    }
    return { recalcVision, recalcMovement };
}

export const selectResize = {
    onDown,
    onMove,
    onUp,
};
