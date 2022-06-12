import { equalsP, toGP, Vector } from "../../core/geometry";
import { FULL_SYNC, SyncMode } from "../../core/models/types";
import { ctrlOrCmdPressed } from "../../core/utils";
import { activeShapeStore } from "../../store/activeShape";
import { clientStore, DEFAULT_GRID_SIZE } from "../../store/client";
import { floorStore } from "../../store/floor";
import { gameStore } from "../../store/game";
import { settingsStore } from "../../store/settings";
import { sendClientLocationOptions } from "../api/emits/client";
import { calculateDelta } from "../drag";
import { getShape } from "../id";
import { selectionState } from "../layers/selection";
import { moveShapes } from "../operations/movement";
import { undoOperation, redoOperation } from "../operations/undo";
import { setCenterPosition } from "../position";
import { deleteShapes, copyShapes, pasteShapes } from "../shapes/utils";
import { moveFloor } from "../temp";
import { toggleActiveMode } from "../tools/tools";

export function onKeyUp(event: KeyboardEvent): void {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        // no-op (condition is cleaner this way)
    } else {
        if (event.key === "Delete" || event.key === "Del" || event.key === "Backspace") {
            const selection = selectionState.get({ includeComposites: true });
            deleteShapes(selection, SyncMode.FULL_SYNC);
        }
        if (event.key === " " || (event.code === "Numpad0" && !ctrlOrCmdPressed(event))) {
            // Spacebar or numpad-zero: cycle through own tokens
            // numpad-zero only if Ctrl is not pressed, as this would otherwise conflict with Ctrl + 0
            const tokens = [...gameStore.state.ownedTokens].map((o) => getShape(o)!);
            if (tokens.length === 0) return;
            const i = tokens.findIndex((o) => equalsP(o.center(), clientStore.screenCenter));
            const token = tokens[(i + 1) % tokens.length];
            setCenterPosition(token.center());
            floorStore.selectFloor({ name: token.floor.name }, true);
        }
        if (event.key === "Enter") {
            if (selectionState.hasSelection) {
                activeShapeStore.setShowEditDialog(true);
            }
        }
    }
}

export async function onKeyDown(event: KeyboardEvent): Promise<void> {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        // Ctrl-a with a HTMLInputElement or a HTMLTextAreaElement selected - select all the text
        if (event.key === "a" && ctrlOrCmdPressed(event)) event.target.select();
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
            if (settingsStore.gridType.value === "FLAT_HEX" && offsetX != 0) {
                offsetX = (1.5 * offsetX) / Math.sqrt(3);
                offsetY *= 0.5;
            } else if (settingsStore.gridType.value === "POINTY_HEX" && offsetY != 0) {
                offsetX *= 0.5;
                offsetY = (1.5 * offsetY) / Math.sqrt(3);
            }
            if (selectionState.hasSelection) {
                // if in hex-mode, first invalidate invalid axis
                const flatHexInvalid = ["ArrowLeft", "ArrowRight", "Numpad4", "Numpad6"];
                const pointyHexInvalid = ["ArrowUp", "ArrowDown", "Numpad2", "Numpad8"];
                if (settingsStore.gridType.value === "FLAT_HEX" && flatHexInvalid.includes(event.code)) {
                    offsetX = 0;
                } else if (settingsStore.gridType.value === "POINTY_HEX" && pointyHexInvalid.includes(event.code)) {
                    offsetY = 0;
                }
                const selection = selectionState.get({ includeComposites: false });
                let delta = new Vector(offsetX, offsetY);
                if (!event.shiftKey || !gameStore.state.isDm) {
                    // First check for collisions.  Using the smooth wall slide collision check used on mouse move is overkill here.
                    for (const sel of selection) {
                        delta = calculateDelta(delta, sel, true);
                    }
                }
                if (delta.length() === 0) return;

                await moveShapes(selection, delta, false);
            } else {
                // The pan offsets should be in the opposite direction to give the correct feel.
                clientStore.increasePanX(offsetX * -1);
                clientStore.increasePanY(offsetY * -1);
                floorStore.invalidateAllFloors();
                sendClientLocationOptions();
            }
        } else if (event.key === "d") {
            // d - Deselect all
            selectionState.clear();
            floorStore.currentLayer.value!.invalidate(true);
        } else if (event.key === "x") {
            // x - Mark Defeated
            const selection = selectionState.get({ includeComposites: true });
            for (const shape of selection) {
                const isDefeated = !shape.isDefeated;
                shape.setDefeated(isDefeated, FULL_SYNC);
            }
            event.preventDefault();
            event.stopPropagation();
        } else if (event.key === "l" && ctrlOrCmdPressed(event)) {
            const selection = selectionState.get({ includeComposites: true });
            for (const shape of selection) {
                // This and GroupSettings are the only places currently where we would need to update both UI and Server.
                // Might need to introduce a SyncTo.BOTH
                const isLocked = !shape.isLocked;
                shape.setLocked(isLocked, FULL_SYNC);
            }
            event.preventDefault();
            event.stopPropagation();
        } else if (event.key === "u" && ctrlOrCmdPressed(event)) {
            // Ctrl-u - disable and reenable the Interface
            event.preventDefault();
            event.stopPropagation();
            gameStore.toggleUi();
        } else if (event.key === "0" && ctrlOrCmdPressed(event)) {
            // Ctrl-0 or numpad 0 - Re-center/reset the viewport
            setCenterPosition(toGP(0, 0));
            sendClientLocationOptions();
            floorStore.invalidateAllFloors();
        } else if (event.code === "Numpad5") {
            // numpad 5 will center on selected shape(s) or on origin
            let targetX = 0;
            let targetY = 0;
            if (selectionState.hasSelection) {
                const selection = selectionState.get({ includeComposites: false });
                for (const sel of selection) {
                    targetX += sel.refPoint.x;
                    targetY += sel.refPoint.y;
                }
                targetX /= selection.length;
                targetY /= selection.length;
            }
            setCenterPosition(toGP(targetX, targetY));
            sendClientLocationOptions();
            floorStore.invalidateAllFloors();
        } else if (event.key === "c" && ctrlOrCmdPressed(event)) {
            // Ctrl-c - Copy
            copyShapes();
        } else if (event.key === "v" && ctrlOrCmdPressed(event)) {
            // Ctrl-v - Paste
            pasteShapes();
        } else if (event.key.toLocaleLowerCase() === "z" && event.shiftKey && ctrlOrCmdPressed(event)) {
            redoOperation();
            event.preventDefault();
            event.stopPropagation();
        } else if (event.key === "z" && ctrlOrCmdPressed(event)) {
            undoOperation();
            event.preventDefault();
            event.stopPropagation();
        } else if (event.key === "PageUp" && floorStore.state.floorIndex < floorStore.state.floors.length - 1) {
            // Page Up - Move floor up
            // Alt + Page Up - Move selected shapes floor up
            // Alt + Shift + Page Up - Move selected shapes floor up AND move floor up
            event.preventDefault();
            event.stopPropagation();
            const targetFloor = floorStore.state.floors.findIndex(
                (f, i) => i > floorStore.state.floorIndex && (gameStore.state.isDm || f.playerVisible),
            );

            changeFloor(event, targetFloor);
        } else if (event.key === "PageDown" && floorStore.state.floorIndex > 0) {
            // Page Down - Move floor down
            // Alt + Page Down - Move selected shape floor down
            // Alt + Shift + Page Down - Move selected shapes floor down AND move floor down
            event.preventDefault();
            event.stopPropagation();
            const maxLength = floorStore.state.floors.length - 1;
            let targetFloor = [...floorStore.state.floors]
                .reverse()
                .findIndex(
                    (f, i) => maxLength - i < floorStore.state.floorIndex && (gameStore.state.isDm || f.playerVisible),
                );
            targetFloor = maxLength - targetFloor;

            changeFloor(event, targetFloor);
        } else if (event.key === "Tab") {
            event.preventDefault();
            toggleActiveMode();
        }
    }
}

function changeFloor(event: KeyboardEvent, targetFloor: number): void {
    if (targetFloor < 0 || targetFloor > floorStore.state.floors.length - 1) return;
    const selection = selectionState.get({ includeComposites: true });
    const newFloor = floorStore.state.floors[targetFloor];

    if (event.altKey) {
        moveFloor([...selection], newFloor, true);
    }
    selectionState.clear();
    floorStore.currentLayer.value!.invalidate(true);
    if (!event.altKey || event.shiftKey) {
        floorStore.selectFloor({ position: targetFloor }, true);
    }
    if (event.shiftKey) for (const shape of selection) selectionState.push(shape);
}
