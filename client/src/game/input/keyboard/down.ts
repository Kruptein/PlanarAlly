import { toGP, Vector } from "../../../core/geometry";
import { DEFAULT_GRID_SIZE, GridType } from "../../../core/grid";
import { FULL_SYNC } from "../../../core/models/types";
import { ctrlOrCmdPressed } from "../../../core/utils";
import { sendClientLocationOptions } from "../../api/emits/client";
import { calculateDelta } from "../../drag";
import { ToolName } from "../../models/tools";
import type { ISelectTool } from "../../models/tools";
import { moveShapes } from "../../operations/movement";
import { redoOperation, undoOperation } from "../../operations/undo";
import { setCenterPosition } from "../../position";
import { copyShapes, pasteShapes } from "../../shapes/utils";
import { accessSystem } from "../../systems/access";
import { toggleAssetManager } from "../../systems/assets/ui";
import { floorSystem } from "../../systems/floors";
import { floorState } from "../../systems/floors/state";
import { gameState } from "../../systems/game/state";
import { toggleNoteManager } from "../../systems/notes/ui";
import { positionSystem } from "../../systems/position";
import { propertiesSystem } from "../../systems/properties";
import { getProperties } from "../../systems/properties/state";
import { selectedSystem } from "../../systems/selected";
import { locationSettingsState } from "../../systems/settings/location/state";
import { uiSystem } from "../../systems/ui";
import { moveFloor } from "../../temp";
import { toggleActiveMode, toolMap } from "../../tools/tools";

export async function onKeyDown(event: KeyboardEvent): Promise<void> {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        // Ctrl-a with a HTMLInputElement or a HTMLTextAreaElement selected - select all the text
        if (event.key === "a" && ctrlOrCmdPressed(event)) event.target.select();
    } else if (event.target instanceof HTMLElement && event.target.contentEditable === "true") {
        // no-op - we're editing a contentEditable element
    } else {
        const navKeys = [
            "ArrowLeft",
            "ArrowRight",
            "ArrowUp",
            "ArrowDown",
            "Numpad1",
            "Numpad2",
            "Numpad3",
            "Numpad4",
            "Numpad6",
            "Numpad7",
            "Numpad8",
            "Numpad9",
        ];
        if (navKeys.includes(event.code)) {
            // Arrow keys & Numpad 1-4/6-9 - move the selection or the camera
            // todo: this should already be rounded
            const gridSize = DEFAULT_GRID_SIZE;
            let offsetX = 0;
            let offsetY = 0;
            const left = ["ArrowLeft", "Numpad1", "Numpad4", "Numpad7"];
            const right = ["ArrowRight", "Numpad3", "Numpad6", "Numpad9"];
            const up = ["ArrowUp", "Numpad7", "Numpad8", "Numpad9"];
            const down = ["ArrowDown", "Numpad1", "Numpad2", "Numpad3"];
            if (left.includes(event.code)) {
                offsetX -= gridSize;
            }
            if (right.includes(event.code)) {
                offsetX += gridSize;
            }
            if (up.includes(event.code)) {
                offsetY -= gridSize;
            }
            if (down.includes(event.code)) {
                offsetY += gridSize;
            }
            // in hex mode, if movement is diagonal, offsets have to be modified
            if (locationSettingsState.raw.gridType.value === GridType.FlatHex && offsetX != 0) {
                offsetX = (1.5 * offsetX) / Math.sqrt(3);
                offsetY *= 0.5;
            } else if (locationSettingsState.raw.gridType.value === GridType.PointyHex && offsetY != 0) {
                offsetX *= 0.5;
                offsetY = (1.5 * offsetY) / Math.sqrt(3);
            }
            if (selectedSystem.hasSelection) {
                // if in hex-mode, first invalidate invalid axis
                const flatHexInvalid = ["ArrowLeft", "ArrowRight", "Numpad4", "Numpad6"];
                const pointyHexInvalid = ["ArrowUp", "ArrowDown", "Numpad2", "Numpad8"];
                if (
                    locationSettingsState.raw.gridType.value === GridType.FlatHex &&
                    flatHexInvalid.includes(event.code)
                ) {
                    offsetX = 0;
                } else if (
                    locationSettingsState.raw.gridType.value === GridType.PointyHex &&
                    pointyHexInvalid.includes(event.code)
                ) {
                    offsetY = 0;
                }
                const selection = selectedSystem.get({ includeComposites: false });
                let delta = new Vector(offsetX, offsetY);
                if (!event.shiftKey || !gameState.raw.isDm) {
                    // First check for collisions.  Using the smooth wall slide collision check used on mouse move is overkill here.
                    for (const sel of selection) {
                        delta = calculateDelta(delta, sel, true);
                    }
                }
                if (delta.length() === 0) return;

                await moveShapes(selection, delta, false);
                (toolMap[ToolName.Select] as ISelectTool).resetRotationHelper();
            } else {
                // The pan offsets should be in the opposite direction to give the correct feel.
                positionSystem.increasePan(offsetX * -1, offsetY * -1);
                floorSystem.invalidateAllFloors();
                sendClientLocationOptions(false);
            }
        } else if (event.key === "d") {
            // d - Deselect all
            selectedSystem.clear();
            floorState.currentLayer.value!.invalidate(true);
        } else if (event.key === "x") {
            // x - Mark Defeated
            const selection = selectedSystem.get({ includeComposites: true });
            for (const shape of selection) {
                if (accessSystem.hasAccessTo(shape.id, false, { edit: true })) {
                    const isDefeated = getProperties(shape.id)!.isDefeated;
                    propertiesSystem.setIsDefeated(shape.id, !isDefeated, FULL_SYNC);
                }
            }
            event.preventDefault();
            event.stopPropagation();
        } else if (event.key === "l" && ctrlOrCmdPressed(event)) {
            const selection = selectedSystem.get({ includeComposites: true });
            for (const shape of selection) {
                if (accessSystem.hasAccessTo(shape.id, false, { edit: true })) {
                    // This and GroupSettings are the only places currently where we would need to update both UI and Server.
                    // Might need to introduce a SyncTo.BOTH
                    const isLocked = getProperties(shape.id)!.isLocked;
                    propertiesSystem.setLocked(shape.id, !isLocked, FULL_SYNC);
                }
            }
            event.preventDefault();
            event.stopPropagation();
        } else if (event.key === "u" && ctrlOrCmdPressed(event)) {
            // Ctrl-u - disable and reenable the Interface
            event.preventDefault();
            event.stopPropagation();
            uiSystem.toggleUi();
        } else if (event.key === "0" && ctrlOrCmdPressed(event)) {
            // Ctrl-0 or numpad 0 - Re-center/reset the viewport
            setCenterPosition(toGP(0, 0));
        } else if (event.code === "Numpad5") {
            // numpad 5 will center on selected shape(s) or on origin
            let targetX = 0;
            let targetY = 0;
            if (selectedSystem.hasSelection) {
                const selection = selectedSystem.get({ includeComposites: false });
                for (const sel of selection) {
                    targetX += sel.refPoint.x;
                    targetY += sel.refPoint.y;
                }
                targetX /= selection.length;
                targetY /= selection.length;
            }
            setCenterPosition(toGP(targetX, targetY));
        } else if (event.key === "c" && ctrlOrCmdPressed(event)) {
            // Ctrl-c - Copy
            copyShapes();
        } else if (event.key === "v" && ctrlOrCmdPressed(event)) {
            // Ctrl-v - Paste
            pasteShapes();
        } else if (event.key.toLocaleLowerCase() === "z" && event.shiftKey && ctrlOrCmdPressed(event)) {
            await redoOperation();
            event.preventDefault();
            event.stopPropagation();
        } else if (event.key === "z" && ctrlOrCmdPressed(event)) {
            await undoOperation();
            event.preventDefault();
            event.stopPropagation();
        } else if (event.key === "PageUp" && floorState.raw.floorIndex < floorState.raw.floors.length - 1) {
            // Page Up - Move floor up
            // Alt + Page Up - Move selected shapes floor up
            // Alt + Shift + Page Up - Move selected shapes floor up AND move floor up
            event.preventDefault();
            event.stopPropagation();
            const targetFloor = floorState.raw.floors.findIndex(
                (f, i) => i > floorState.raw.floorIndex && (gameState.raw.isDm || f.playerVisible),
            );

            changeFloor(event, targetFloor);
        } else if (event.key === "PageDown" && floorState.raw.floorIndex > 0) {
            // Page Down - Move floor down
            // Alt + Page Down - Move selected shape floor down
            // Alt + Shift + Page Down - Move selected shapes floor down AND move floor down
            event.preventDefault();
            event.stopPropagation();
            const maxLength = floorState.raw.floors.length - 1;
            let targetFloor = [...floorState.raw.floors]
                .reverse()
                .findIndex(
                    (f, i) => maxLength - i < floorState.raw.floorIndex && (gameState.raw.isDm || f.playerVisible),
                );
            targetFloor = maxLength - targetFloor;

            changeFloor(event, targetFloor);
        } else if (event.key === "Tab") {
            event.preventDefault();
            toggleActiveMode();
        } else if (event.key === "n") {
            event.preventDefault();
            toggleNoteManager();
        } else if (event.key === "a") {
            event.preventDefault();
            toggleAssetManager();
        }
    }
}

function changeFloor(event: KeyboardEvent, targetFloor: number): void {
    const newFloor = floorState.raw.floors[targetFloor];
    if (newFloor === undefined) return;

    const selection = selectedSystem.get({ includeComposites: false });

    if (event.altKey) {
        moveFloor([...selectedSystem.get({ includeComposites: true })], newFloor, true);
    }
    selectedSystem.clear();
    floorState.currentLayer.value!.invalidate(true);
    if (!event.altKey || event.shiftKey) {
        floorSystem.selectFloor({ position: targetFloor }, true);
    }
    if (event.shiftKey) {
        selectedSystem.push(...selection.map((s) => s.id));
    }
}
