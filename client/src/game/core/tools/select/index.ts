import { l2g } from "../../../../core/conversions";
import type { LocalPoint } from "../../../../core/geometry";
import { ctrlOrCmdPressed } from "../../../../core/utils";
import type { PressedModifiers } from "../../../common/events";
import { SelectFeatures } from "../../../dom/tools/models/select";
import { postUi } from "../../../messages/ui";
import type { IShape } from "../../interfaces/shape";
import type { ToolFeatures } from "../../models/tools";
import { ToolName } from "../../models/tools";
import { addOperation } from "../../operations/undo";
import { accessSystem } from "../../systems/access";
import { floorState } from "../../systems/floors/state";
import { getProperties } from "../../systems/properties/state";
import { selectedSystem } from "../../systems/selected";
import { visionState } from "../../vision/state";
import { hasFeature } from "../feature";

import { selectCursor } from "./cursor";
import { selectDrag } from "./drag";
import { selectGroup } from "./group";
import { selectResize } from "./resize";
import { selectRotation } from "./rotation";
import { SelectOperations, selectCoreState } from "./state";

function onDown(lp: LocalPoint, features: ToolFeatures<SelectFeatures>, pressed: PressedModifiers | undefined): void {
    const gp = l2g(lp);
    const layer = floorState.readonly.currentLayer;
    if (layer === undefined) {
        console.error("No active layer found");
        return;
    }
    // Logic Door Check
    // if (_.hoveredDoor !== undefined && activeToolMode.value === ToolMode.Play) {
    //     if (uiGameState.raw.isDm) {
    //         doorSystem.toggleDoor(_.hoveredDoor);
    //         return;
    //     } else {
    //         if (doorSystem.canUse(_.hoveredDoor, playerSystem.getCurrentPlayerId()!) === Access.Request) {
    //             toast.info("Request to open door sent", {
    //                 position: POSITION.TOP_RIGHT,
    //             });
    //         }
    //         const door = getGlobalId(_.hoveredDoor);
    //         if (door) sendRequest({ door, logic: "door" });
    //         return;
    //     }
    // }

    selectCoreState.operationReady = false;
    selectCoreState.operationList = undefined;

    let hit = false;
    // The selectionStack allows for lower positioned objects that are selected to have precedence during overlap.
    const layerSelection = selectedSystem.get({ includeComposites: false });
    let selectionStack: readonly IShape[];
    if (hasFeature(SelectFeatures.ChangeSelection, features)) {
        const shapes = layer.getShapes({ includeComposites: false });
        if (!layerSelection.length) selectionStack = shapes;
        else selectionStack = shapes.concat(layerSelection);
    } else {
        selectionStack = layerSelection;
    }
    for (let i = selectionStack.length - 1; i >= 0; i--) {
        const shape = selectionStack[i]!;
        if (!(shape.options.preFogShape ?? false) && (shape.options.skipDraw ?? false)) continue;
        if (selectRotation.isRotationShape(shape.id)) continue;
        const props = getProperties(shape.id)!;
        if (props.isInvisible && !accessSystem.hasAccessTo(shape.id, false, { movement: true })) continue;

        if (selectRotation.onDown(gp, features)) {
            hit = true;
        } else if (selectResize.onDown(gp, shape, features)) {
            hit = true;
        } else if (shape.contains(gp)) {
            if (!layerSelection.includes(shape)) {
                if (ctrlOrCmdPressed(pressed)) {
                    selectedSystem.push(shape.id);
                } else {
                    selectedSystem.set(shape.id);
                }
                selectRotation.updateUi(features);
            } else {
                if (ctrlOrCmdPressed(pressed)) {
                    selectedSystem.remove(shape.id);
                }
            }
            // Drag case, a shape is selected
            if (!props.isLocked) selectDrag.onDown(lp, shape, props.blocksMovement, features);
            layer.invalidate(true);
            hit = true;
        }
    }
    // _$.hasSelection = hit;
    // // GroupSelect case, draw a selection box to select multiple shapes
    if (!hit) {
        selectGroup.onDown(gp, pressed, features);
    }
    // if (checkRuler()) {
    //     await rulerTool.onDown(lp, event);
    // }
    if (selectCoreState.mode !== SelectOperations.Noop) {
        void postUi("Tool.Active.Set", { name: ToolName.Select, active: true });
    }
}

async function onMove(
    lp: LocalPoint,
    pressed: PressedModifiers | undefined,
    features: ToolFeatures<SelectFeatures>,
): Promise<void> {
    const gp = l2g(lp);
    // this.lastMousePosition = gp;
    // // Logic hover
    // if (!this.active.value && activeToolMode.value === ToolMode.Play) {
    //     let foundDoor = false;
    //     for (const id of doorSystem.getDoors()) {
    //         const shape = getShape(id);
    //         if (shape === undefined) continue;
    //         if (shape.floorId !== floorState.readonly.currentFloor!.id) continue;
    //         if (!shape.contains(gp)) continue;
    //         if (doorSystem.canUse(id, playerSystem.getCurrentPlayerId()!) === Access.Disabled) continue;
    //         foundDoor = true;
    //         _.hoveredDoor = id;
    //         const state = doorSystem.getCursorState(id);
    //         if (state !== undefined)
    //             document.body.style.cursor = `url('${baseAdjust(`static/img/${state}.svg`)}') 16 16, auto`;
    //         break;
    //     }
    //     if (!foundDoor) {
    //         _.hoveredDoor = undefined;
    //         document.body.style.cursor = "default";
    //     }
    // }
    // // We require move for the resize and rotate cursors
    // if (
    //     !this.active.value &&
    //     !(
    //         this.hasFeature(SelectFeatures.Resize, features) ||
    //         this.hasFeature(SelectFeatures.Rotate, features) ||
    //         this.hasFeature(SelectFeatures.PolygonEdit, features)
    //     )
    // )
    //     return;

    const mode = selectCoreState.mode;

    const layerSelection = selectedSystem.get({ includeComposites: false });
    if (layerSelection.some((s) => getProperties(s.id)!.isLocked)) return;

    if (mode === SelectOperations.GroupSelect) {
        selectGroup.onMove(gp);
    } else if (layerSelection.length) {
        if (mode === SelectOperations.Drag) {
            await selectDrag.onMove(lp, layerSelection, pressed?.shift, features);
        } else if (mode === SelectOperations.Resize) {
            selectResize.onMove(gp, layerSelection[0]!, pressed, features);
        } else if (mode === SelectOperations.Rotate) {
            selectRotation.onMove(gp);
        } else {
            selectCursor.updateCursor(gp, features);
        }
    } else {
        await postUi("Cursor.Set", "default");
    }
}

async function onUp(
    lp: LocalPoint,
    pressed: PressedModifiers | undefined,
    features: ToolFeatures<SelectFeatures>,
): Promise<void> {
    const layerSelection = selectedSystem.get({ includeComposites: false });
    if (layerSelection.some((s) => getProperties(s.id)!.isLocked)) return;

    const mode = selectCoreState.mode;

    if (mode === SelectOperations.GroupSelect) {
        selectGroup.onUp(layerSelection, pressed, features);
    } else if (layerSelection.length) {
        let recalcVision = false;
        let recalcMovement = false;
        if (mode === SelectOperations.Drag) {
            ({ recalcVision, recalcMovement } = await selectDrag.onUp(layerSelection, pressed, features));
        } else if (mode === SelectOperations.Resize) {
            ({ recalcVision, recalcMovement } = selectResize.onUp(layerSelection, pressed, features));
        } else if (mode === SelectOperations.Rotate) {
            selectRotation.onUp(layerSelection, pressed, features);
        }

        const floorId = layerSelection[0]?.floorId;
        if (floorId !== undefined) {
            if (recalcVision) visionState.recalculateVision(floorId);
            if (recalcMovement) visionState.recalculateMovement(floorId);
        }
        floorState.readonly.currentLayer?.invalidate(false);

        // Other operations usually desync the rotation UI
        if (mode !== SelectOperations.Rotate) {
            selectRotation.updateUi(features);
        }
    }
    if (selectCoreState.operationReady) addOperation(selectCoreState.operationList!);
    // _$.hasSelection = layerSelection.length > 0;
    selectCoreState.mode = SelectOperations.Noop;
}

export const selectCoreTool = {
    onDown,
    onMove,
    onUp,
};
