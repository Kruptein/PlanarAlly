import { GlobalPoint, Vector } from "@/game/geom";
import { layerManager } from "@/game/layers/manager";
import { copyShapes, deleteShapes, pasteShapes } from "@/game/shapes/utils";
import { DEFAULT_GRID_SIZE, gameStore } from "@/game/store";
import { calculateDelta } from "@/game/ui/tools/utils";

import { SyncMode, SyncTo } from "../../core/models/types";
import { sendClientLocationOptions } from "../api/emits/client";
import { EventBus } from "../event-bus";
import { floorStore } from "../layers/store";
import { moveFloor } from "../layers/utils";
import { gameManager } from "../manager";
import { moveShapes } from "../operations/movement";
import { redoOperation, undoOperation } from "../operations/undo";
import { gameSettingsStore } from "../settings";
import { activeShapeStore } from "../ui/ActiveShapeStore";

export function onKeyUp(event: KeyboardEvent): void {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        // no-op (condition is cleaner this way)
    } else {
        if (event.key === "Delete" || event.key === "Del" || event.key === "Backspace") {
            const l = floorStore.currentLayer!;
            const selection = l.getSelection({ includeComposites: true });
            deleteShapes(selection, SyncMode.FULL_SYNC);
        }
        if (event.key === " " || (event.code === "Numpad0" && !event.ctrlKey)) {
            // Spacebar or numpad-zero: cycle through own tokens
            // numpad-zero only if Ctrl is not pressed, as this would otherwise conflict with Ctrl + 0
            const tokens = gameStore.ownedtokens.map((o) => layerManager.UUIDMap.get(o)!);
            if (tokens.length === 0) return;
            const i = tokens.findIndex((o) => o.center().equals(gameStore.screenCenter));
            const token = tokens[(i + 1) % tokens.length];
            gameManager.setCenterPosition(token.center());
            floorStore.selectFloor({ targetFloor: token.floor.name, sync: true });
        }
        if (event.key === "Enter") {
            const selection = layerManager.getSelection({ includeComposites: false });
            if (selection.length === 1) {
                activeShapeStore.setShowEditDialog(true);
            }
        }
    }
}

export async function onKeyDown(event: KeyboardEvent): Promise<void> {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        // Ctrl-a with a HTMLInputElement or a HTMLTextAreaElement selected - select all the text
        if (event.key === "a" && event.ctrlKey) event.target.select();
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
            if (gameSettingsStore.gridType === "FLAT_HEX" && offsetX != 0) {
                offsetX = (1.5 * offsetX) / Math.sqrt(3);
                offsetY *= 0.5;
            } else if (gameSettingsStore.gridType === "POINTY_HEX" && offsetY != 0) {
                offsetX *= 0.5;
                offsetY = (1.5 * offsetY) / Math.sqrt(3);
            }
            if (layerManager.hasSelection()) {
                // if in hex-mode, first invalidate invalid axis
                const flatHexInvalid = ["ArrowLeft", "ArrowRight", "Numpad4", "Numpad6"];
                const pointyHexInvalid = ["ArrowUp", "ArrowDown", "Numpad2", "Numpad8"];
                if (gameSettingsStore.gridType === "FLAT_HEX" && flatHexInvalid.includes(event.code)) {
                    offsetX = 0;
                } else if (gameSettingsStore.gridType === "POINTY_HEX" && pointyHexInvalid.includes(event.code)) {
                    offsetY = 0;
                }
                const selection = layerManager.getSelection({ includeComposites: false });
                let delta = new Vector(offsetX, offsetY);
                if (!event.shiftKey || !gameStore.IS_DM) {
                    // First check for collisions.  Using the smooth wall slide collision check used on mouse move is overkill here.
                    for (const sel of selection) {
                        delta = calculateDelta(delta, sel, true);
                    }
                }
                if (delta.length() === 0) return;

                moveShapes(selection, delta, false);
            } else {
                // The pan offsets should be in the opposite direction to give the correct feel.
                gameStore.increasePanX(offsetX * -1);
                gameStore.increasePanY(offsetY * -1);
                layerManager.invalidateAllFloors();
                sendClientLocationOptions();
            }
        } else if (event.key === "d") {
            // d - Deselect all
            layerManager.clearSelection();
        } else if (event.key === "l" && event.ctrlKey) {
            const selection = layerManager.getSelection({ includeComposites: true });
            for (const shape of selection) {
                // This and GroupSettings are the only places currently where we would need to update both UI and Server.
                // Might need to introduce a SyncTo.BOTH
                const isLocked = !shape.isLocked;
                shape.setLocked(isLocked, SyncTo.SERVER);
                if (activeShapeStore.uuid === shape.uuid) {
                    activeShapeStore.setLocked({ isLocked, syncTo: SyncTo.UI });
                }
            }
            event.preventDefault();
            event.stopPropagation();
        } else if (event.key === "u" && event.ctrlKey) {
            // Ctrl-u - disable and reenable the Interface
            event.preventDefault();
            event.stopPropagation();
            gameStore.toggleUI();
        } else if (event.key === "0" && event.ctrlKey) {
            // Ctrl-0 or numpad 0 - Re-center/reset the viewport
            gameManager.setCenterPosition(new GlobalPoint(0, 0));
            sendClientLocationOptions();
            layerManager.invalidateAllFloors();
        } else if (event.code === "Numpad5") {
            // numpad 5 will center on selected shape(s) or on origin
            let targetX = 0;
            let targetY = 0;
            if (layerManager.hasSelection()) {
                const selection = layerManager.getSelection({ includeComposites: false });
                for (const sel of selection) {
                    targetX += sel.refPoint.x;
                    targetY += sel.refPoint.y;
                }
                targetX /= selection.length;
                targetY /= selection.length;
            }
            gameManager.setCenterPosition(new GlobalPoint(targetX, targetY));
            sendClientLocationOptions();
            layerManager.invalidateAllFloors();
        } else if (event.key === "c" && event.ctrlKey) {
            // Ctrl-c - Copy
            copyShapes();
        } else if (event.key === "v" && event.ctrlKey) {
            // Ctrl-v - Paste
            await pasteShapes();
        } else if (event.key === "z" && event.ctrlKey) {
            await undoOperation();
            event.preventDefault();
            event.stopPropagation();
        } else if (event.key === "Z" && event.ctrlKey) {
            await redoOperation();
            event.preventDefault();
            event.stopPropagation();
        } else if (event.key === "PageUp" && floorStore.currentFloorindex < floorStore.floors.length - 1) {
            // Page Up - Move floor up
            // Alt + Page Up - Move selected shapes floor up
            // Alt + Shift + Page Up - Move selected shapes floor up AND move floor up
            event.preventDefault();
            event.stopPropagation();
            const targetFloor = floorStore.floors.findIndex(
                (f, i) => i > floorStore.currentFloorindex && (gameStore.IS_DM || f.playerVisible),
            );

            changeFloor(event, targetFloor);
        } else if (event.key === "PageDown" && floorStore.currentFloorindex > 0) {
            // Page Down - Move floor down
            // Alt + Page Down - Move selected shape floor down
            // Alt + Shift + Page Down - Move selected shapes floor down AND move floor down
            event.preventDefault();
            event.stopPropagation();
            const maxLength = floorStore.floors.length - 1;
            let targetFloor = [...floorStore.floors]
                .reverse()
                .findIndex(
                    (f, i) => maxLength - i < floorStore.currentFloorindex && (gameStore.IS_DM || f.playerVisible),
                );
            targetFloor = maxLength - targetFloor;

            changeFloor(event, targetFloor);
        } else if (event.key === "Tab") {
            event.preventDefault();
            EventBus.$emit("ToolMode.Toggle");
        }
    }
}

function changeFloor(event: KeyboardEvent, targetFloor: number): void {
    if (targetFloor < 0 || targetFloor > floorStore.floors.length - 1) return;
    const selection = layerManager.getSelection({ includeComposites: true });
    const newFloor = floorStore.floors[targetFloor];
    const newLayer = layerManager.getLayer(newFloor)!;

    if (event.altKey) {
        moveFloor([...selection], newFloor, true);
    }
    layerManager.clearSelection();
    if (!event.altKey || event.shiftKey) {
        floorStore.selectFloor({ targetFloor, sync: true });
    }
    if (event.shiftKey) for (const shape of selection) newLayer.pushSelection(shape);
}
