import type { GlobalPoint } from "../../../../core/geometry";
import { Ray, toGP } from "../../../../core/geometry";
import { InvalidationMode, NO_SYNC, SyncMode } from "../../../../core/models/types";
import { ctrlOrCmdPressed } from "../../../../core/utils";
import type { PressedModifiers } from "../../../common/events";
import { SelectFeatures } from "../../../dom/tools/models/select";
import type { IShape } from "../../interfaces/shape";
import type { ToolFeatures } from "../../models/tools";
import { Rect } from "../../shapes/variants/rect";
import { accessSystem } from "../../systems/access";
import { floorState } from "../../systems/floors/state";
import { playerSystem } from "../../systems/players";
import { getProperties } from "../../systems/properties/state";
import { selectedSystem } from "../../systems/selected";
import { hasFeature } from "../feature";

import { selectRotation } from "./rotation";
import { SelectOperations, selectCoreState } from "./state";

interface GroupState {
    startPoint: GlobalPoint;
    helper: Rect | undefined;
}

const state: GroupState = {
    startPoint: toGP(-1000, -1000),
    helper: undefined,
};

function onDown(gp: GlobalPoint, pressed: PressedModifiers | undefined, features: ToolFeatures<SelectFeatures>): void {
    if (!hasFeature(SelectFeatures.ChangeSelection, features)) return;
    if (!hasFeature(SelectFeatures.GroupSelect, features)) return;

    const layer = floorState.readonly.currentLayer!;

    selectCoreState.mode = SelectOperations.GroupSelect;
    state.startPoint = gp;
    if (state.helper === undefined) {
        state.helper = new Rect(
            state.startPoint,
            0,
            0,
            {
                isSnappable: false,
            },
            { fillColour: "rgba(0, 0, 0, 0)", strokeColour: ["#7c253e"] },
        );
        state.helper.strokeWidth = 2;
        state.helper.options.UiHelper = true;
        accessSystem.addAccess(
            state.helper.id,
            playerSystem.getCurrentPlayer()!.name,
            { edit: true, movement: true, vision: true },
            NO_SYNC,
        );
        layer.addShape(state.helper, SyncMode.NO_SYNC, InvalidationMode.NO);
    } else {
        state.helper.refPoint = state.startPoint;
        state.helper.w = 0;
        state.helper.h = 0;
    }
    if (!ctrlOrCmdPressed(pressed)) {
        selectedSystem.clear();
    }
    selectRotation.removeUi();
    layer.invalidate(true);
}

function onMove(gp: GlobalPoint): void {
    const endPoint = gp;
    state.helper!.w = Math.abs(endPoint.x - state.startPoint.x);
    state.helper!.h = Math.abs(endPoint.y - state.startPoint.y);
    state.helper!.refPoint = toGP(Math.min(state.startPoint.x, endPoint.x), Math.min(state.startPoint.y, endPoint.y));

    const layer = floorState.readonly.currentLayer;
    layer?.invalidate(true);
}

function onUp(
    layerSelection: readonly IShape[],
    pressed: PressedModifiers | undefined,
    features: ToolFeatures<SelectFeatures>,
): void {
    if (ctrlOrCmdPressed(pressed)) {
        // If either control or shift are pressed, do not remove selection
    } else {
        selectedSystem.clear();
    }

    const layer = floorState.readonly.currentLayer!;

    const cbbox = state.helper!.getBoundingBox();
    for (const shape of layer.getShapes({ includeComposites: false })) {
        if (!(shape.options.preFogShape ?? false) && (shape.options.skipDraw ?? false)) continue;
        if (!accessSystem.hasAccessTo(shape.id, false, { movement: true })) continue;
        if (!shape.visibleInCanvas({ w: layer.width, h: layer.height }, { includeAuras: false })) continue;
        if (layerSelection.some((s) => s.id === shape.id)) continue;
        const points = shape.points; // expensive call
        if (points.length > 1) {
            for (let i = 0; i < points.length; i++) {
                const ray = Ray.fromPoints(toGP(points[i]!), toGP(points[(i + 1) % points.length]!));
                if (cbbox.containsRay(ray).hit) {
                    selectedSystem.push(shape.id);
                    i = points.length; // break out of the inner loop
                }
            }
        } else if (points.length === 1) {
            if (cbbox.contains(toGP(points[0]!))) {
                selectedSystem.push(shape.id);
            }
        }
    }
    layer.removeShape(state.helper!, { sync: SyncMode.NO_SYNC, recalculate: true, dropShapeId: true });
    state.helper = undefined;
    layerSelection = selectedSystem.get({ includeComposites: false });
    if (layerSelection.some((s) => !getProperties(s.id)!.isLocked)) {
        selectedSystem.set(...layerSelection.filter((s) => !getProperties(s.id)!.isLocked).map((s) => s.id));
    }
    if (layerSelection.length > 0 && hasFeature(SelectFeatures.Rotate, features)) {
        selectRotation.createUi(features);
    }
    layer.invalidate(true);
}

export const selectGroup = {
    onDown,
    onMove,
    onUp,
};
