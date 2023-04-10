import { l2gz } from "../../../../core/conversions";
import type { GlobalPoint } from "../../../../core/geometry";
import { Vector, toGP, addP, toArrayP } from "../../../../core/geometry";
import { equalPoints } from "../../../../core/math";
import { NO_SYNC, SyncMode, InvalidationMode } from "../../../../core/models/types";
import type { PressedModifiers } from "../../../common/events";
import { SelectFeatures } from "../../../dom/tools/models/select";
import { sendShapePositionUpdate } from "../../api/emits/shape/core";
import type { LocalId } from "../../id";
import type { IShape } from "../../interfaces/shape";
import type { ToolFeatures } from "../../models/tools";
import { rotateShapes } from "../../operations/rotation";
import { Circle } from "../../shapes/variants/circle";
import { Line } from "../../shapes/variants/line";
import { Rect } from "../../shapes/variants/rect";
import type { BoundingRect } from "../../shapes/variants/simple/boundingRect";
import { accessSystem } from "../../systems/access";
import { floorState } from "../../systems/floors/state";
import { playerSystem } from "../../systems/players";
import { DEFAULT_GRID_SIZE } from "../../systems/position/state";
import { selectedSystem } from "../../systems/selected";
import { playerSettingsState } from "../../systems/settings/players/state";
import { hasFeature } from "../feature";

import { SelectOperations, selectCoreState } from "./state";

// Calculate 45 degrees in radians just once
const ANGLE_SNAP = (45 * Math.PI) / 180;

interface RotationState {
    uiActive: boolean;
    anchor: Line | undefined;
    box: Rect | undefined;
    handle: Circle | undefined;
    angle: number;
}

const state: RotationState = {
    uiActive: false,
    anchor: undefined,
    box: undefined,
    handle: undefined,
    angle: 0,
};

function isRotationShape(id: LocalId): boolean {
    return [state.anchor?.id, state.box?.id, state.handle?.id].includes(id);
}

// INPUT

function onDown(gp: GlobalPoint, features: ToolFeatures<SelectFeatures>): boolean {
    if (!hasFeature(SelectFeatures.Rotate, features)) return false;

    if (state.uiActive) {
        const anchor = state.anchor!.points[1];
        if (anchor && equalPoints(anchor, toArrayP(gp), 10)) {
            selectCoreState.mode = SelectOperations.Rotate;
            selectCoreState.operationList = { type: "rotation", center: toGP(0, 0), shapes: [] };
            for (const shape of selectedSystem.get({ includeComposites: false })) {
                selectCoreState.operationList.shapes.push({ uuid: shape.id, from: shape.angle, to: 0 });
            }
            return true;
        }
    }
    return false;
}

function onMove(gp: GlobalPoint): void {
    const center = state.box!.center;
    const newAngle = -Math.atan2(center.y - gp.y, gp.x - center.x) + Math.PI / 2;
    rotateSelection(newAngle, center, true);
}

function rotateSelection(newAngle: number, center: GlobalPoint, temporary: boolean): void {
    const dA = newAngle - state.angle;
    state.angle = newAngle;
    const layerSelection = selectedSystem.get({ includeComposites: false });
    rotateShapes(layerSelection, dA, center, temporary);
    state.handle!.rotateAround(center, dA);
    state.anchor!.rotateAround(center, dA);
    state.box!.angle = state.angle;

    const layer = floorState.readonly.currentLayer;
    layer?.invalidate(false);
}

function onUp(
    layerSelection: readonly IShape[],
    pressed: PressedModifiers | undefined,
    features: ToolFeatures<SelectFeatures>,
): void {
    const rotationCenter = state.box!.center;

    for (const [s, sel] of layerSelection.entries()) {
        if (!accessSystem.hasAccessTo(sel.id, false, { movement: true })) continue;
        const newAngle = Math.round(state.angle / ANGLE_SNAP) * ANGLE_SNAP;
        if (
            pressed &&
            newAngle !== state.angle &&
            playerSettingsState.useSnapping(pressed.alt) &&
            hasFeature(SelectFeatures.Snapping, features)
        ) {
            rotateSelection(newAngle, rotationCenter, false);
        } else if (!sel.preventSync) sendShapePositionUpdate([sel], false);
        if (selectCoreState.operationList?.type === "rotation" && s < selectCoreState.operationList.shapes.length) {
            selectCoreState.operationList.shapes[s]!.to = sel.angle;
            selectCoreState.operationReady = true;
        }
    }
    if (selectCoreState.operationList?.type === "rotation") {
        selectCoreState.operationList.center = rotationCenter;
    }
}

// UI

function updateUi(features: ToolFeatures<SelectFeatures>): void {
    if (state.uiActive) {
        removeUi();
        createUi(features);
    }
}

function createUi(features: ToolFeatures<SelectFeatures>): void {
    if (state.uiActive) return;

    const layer = floorState.readonly.currentLayer!;
    const layerSelection = selectedSystem.get({ includeComposites: false });
    if (layerSelection.length === 0 || state.uiActive || !hasFeature(SelectFeatures.Rotate, features)) return;
    let bbox: BoundingRect;
    if (layerSelection.length === 1) {
        bbox = layerSelection[0]!.getBoundingBox();
    } else {
        bbox = layerSelection
            .map((s) => s.getAABB())
            .reduce((acc: BoundingRect, val: BoundingRect) => acc.union(val))
            .expand(new Vector(-50, -50));
    }
    const topCenter = toGP((bbox.topRight.x + bbox.topLeft.x) / 2, bbox.topLeft.y);
    const topCenterPlus = addP(topCenter, new Vector(0, -Math.max(DEFAULT_GRID_SIZE, l2gz(DEFAULT_GRID_SIZE / 2))));
    state.angle = 0;
    state.anchor = new Line(
        topCenter,
        topCenterPlus,
        {
            lineWidth: l2gz(1.5),
            isSnappable: false,
        },
        { strokeColour: ["#7c253e"] },
    );
    state.box = new Rect(
        bbox.topLeft,
        bbox.w,
        bbox.h,
        {
            isSnappable: false,
        },
        { fillColour: "rgba(0,0,0,0)", strokeColour: ["#7c253e"] },
    );
    state.box.strokeWidth = 1.5;
    state.handle = new Circle(
        topCenterPlus,
        l2gz(4),
        {
            isSnappable: false,
        },
        { fillColour: "#7c253e", strokeColour: ["rgba(0,0,0,0)"] },
    );
    for (const rotationShape of [state.anchor, state.box, state.handle]) {
        accessSystem.addAccess(
            rotationShape.id,
            playerSystem.getCurrentPlayer()!.name,
            { edit: true, movement: true, vision: true },
            NO_SYNC,
        );
        layer.addShape(rotationShape, SyncMode.NO_SYNC, InvalidationMode.NO);
    }
    if (layerSelection.length === 1) {
        const angle = layerSelection[0]!.angle;
        state.angle = angle;
        state.box.angle = angle;
        state.anchor.rotateAround(bbox.center, angle);
        state.handle.rotateAround(bbox.center, angle);
    }
    state.uiActive = true;
    layer.invalidate(true);
}

function removeUi(): void {
    if (state.uiActive) {
        const layer = state.anchor!.layer;
        if (layer === undefined) return;
        layer.removeShape(state.anchor!, { sync: SyncMode.NO_SYNC, recalculate: true, dropShapeId: true });
        layer.removeShape(state.box!, { sync: SyncMode.NO_SYNC, recalculate: true, dropShapeId: true });
        layer.removeShape(state.handle!, { sync: SyncMode.NO_SYNC, recalculate: true, dropShapeId: true });
        state.anchor = state.box = state.handle = undefined;
        state.uiActive = false;
        layer.invalidate(true);
    }
}

function getCursor(mouse: GlobalPoint): string | undefined {
    if (state.uiActive) {
        const anchor = state.anchor!.points[1];
        if (anchor && equalPoints(anchor, toArrayP(mouse), 10)) {
            return "ew-resize";
        }
    }
}

export const selectRotation = {
    createUi,
    removeUi,
    updateUi,
    isRotationShape,
    onDown,
    onMove,
    onUp,
    getCursor,
};
