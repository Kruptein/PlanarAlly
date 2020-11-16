import { GlobalPoint, Vector } from "@/game/geom";
import { layerManager } from "@/game/layers/manager";
import { copyShapes, deleteShapes, pasteShapes } from "@/game/shapes/utils";
import { DEFAULT_GRID_SIZE, gameStore } from "@/game/store";
import { calculateDelta } from "@/game/ui/tools/utils";
import { visibilityStore } from "@/game/visibility/store";
import { TriangulationTarget } from "@/game/visibility/te/pa";
import { sendClientLocationOptions } from "../api/emits/client";
import { sendShapePositionUpdate } from "../api/emits/shape/core";
import { EventBus } from "../event-bus";
import { floorStore } from "../layers/store";
import { moveFloor } from "../layers/utils";
import { gameManager } from "../manager";
import { gameSettingsStore } from "../settings";

export function onKeyUp(event: KeyboardEvent): void {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        // no-op (condition is cleaner this way)
    } else {
        if (event.key === "Delete" || event.key === "Del" || event.key === "Backspace") {
            deleteShapes();
        }
        if (event.key === " " || (event.keyCode == 96 && event.ctrlKey === false)) {
            // Spacebar or numpad-zero: cycle through own tokens
            // numpad-zero only if Ctrl is not pressed, as this would otherwise conflict with Ctrl + 0
            const tokens = gameStore.ownedtokens.map(o => layerManager.UUIDMap.get(o)!);
            if (tokens.length === 0) return;
            const i = tokens.findIndex(o => o.center().equals(gameStore.screenCenter));
            const token = tokens[(i + 1) % tokens.length];
            gameManager.setCenterPosition(token.center());
            floorStore.selectFloor({ targetFloor: token.floor.name, sync: true });
        }
        if (event.key === "Enter") {
            const selection = layerManager.getSelection();
            if (selection.length === 1) {
                EventBus.$emit("EditDialog.Open", selection[0]);
            }
        }
    }
}

export function onKeyDown(event: KeyboardEvent): void {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        // Ctrl-a with a HTMLInputElement or a HTMLTextAreaElement selected - select all the text
        if (event.key === "a" && event.ctrlKey) event.target.select();
    } else {
        if (
            // Arrow-Keys
            (event.keyCode >= 37 && event.keyCode <= 40) ||
            // Numpad 1-4
            (event.keyCode >= 97 && event.keyCode <= 100) ||
            //Numpad 6-9
            (event.keyCode >= 102 && event.keyCode <= 105)
        ) {
            // Arrow keys & Numpad 1-4/6-9 - move the selection or the camera
            // todo: this should already be rounded
            const gridSize = DEFAULT_GRID_SIZE;
            let offsetX = 0;
            let offsetY = 0;
            // movement is left-up, left, or left-down
            if (event.keyCode == 37 || event.keyCode == 97 || event.keyCode == 100 || event.keyCode == 103) {
                offsetX += gridSize * -1;
            }
            // movement is right-up, right, or right-down
            if (event.keyCode == 39 || event.keyCode == 99 || event.keyCode == 102 || event.keyCode == 105) {
                offsetX += gridSize;
            }
            // movement is left-up, up, or right-up
            if (event.keyCode == 38 || event.keyCode == 103 || event.keyCode == 104 || event.keyCode == 105) {
                offsetY += gridSize * -1;
            }
            // movement is left-down, down, or right-down
            if (event.keyCode == 40 || event.keyCode == 97 || event.keyCode == 98 || event.keyCode == 99) {
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
                if (
                    gameSettingsStore.gridType === "FLAT_HEX" &&
                    (event.keyCode == 37 || event.keyCode == 39 || event.keyCode == 100 || event.keyCode == 102)
                ) {
                    offsetX = 0;
                } else if (
                    gameSettingsStore.gridType === "POINTY_HEX" &&
                    (event.keyCode == 38 || event.keyCode == 40 || event.keyCode == 98 || event.keyCode == 104)
                ) {
                    offsetY = 0;
                }
                const selection = layerManager.getSelection();
                let delta = new Vector(offsetX, offsetY);
                if (!event.shiftKey || !gameStore.IS_DM) {
                    // First check for collisions.  Using the smooth wall slide collision check used on mouse move is overkill here.
                    for (const sel of selection) {
                        delta = calculateDelta(delta, sel, true);
                    }
                }
                if (delta.length() === 0) return;
                let recalculateVision = false;
                let recalculateMovement = false;
                const updateList = [];
                for (const sel of selection) {
                    if (!sel.ownedBy({ movementAccess: true })) continue;
                    if (sel.movementObstruction) {
                        recalculateMovement = true;
                        visibilityStore.deleteFromTriag({
                            target: TriangulationTarget.MOVEMENT,
                            shape: sel,
                        });
                    }
                    if (sel.visionObstruction) {
                        recalculateVision = true;
                        visibilityStore.deleteFromTriag({
                            target: TriangulationTarget.VISION,
                            shape: sel,
                        });
                    }
                    sel.refPoint = sel.refPoint.add(delta);
                    if (sel.movementObstruction)
                        visibilityStore.addToTriag({ target: TriangulationTarget.MOVEMENT, shape: sel });
                    if (sel.visionObstruction)
                        visibilityStore.addToTriag({ target: TriangulationTarget.VISION, shape: sel });
                    // todo: Fix again
                    // if (sel.refPoint.x % gridSize !== 0 || sel.refPoint.y % gridSize !== 0) sel.snapToGrid();
                    if (!sel.preventSync) updateList.push(sel);
                }
                sendShapePositionUpdate(updateList, false);

                const floorId = floorStore.currentFloor.id;
                if (recalculateVision) visibilityStore.recalculateVision(floorId);
                if (recalculateMovement) visibilityStore.recalculateMovement(floorId);
                floorStore.currentLayer!.invalidate(false);
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
            const selection = layerManager.getSelection();
            for (const shape of selection) {
                shape.setLocked(!shape.isLocked, true);
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
        } else if (event.keyCode == 101) {
            // numpad 5 will center on selected shape(s) or on origin
            let targetX = 0;
            let targetY = 0;
            if (layerManager.hasSelection()) {
                const selection = layerManager.getSelection();
                for (const sel of selection) {
                    targetX += sel.refPoint.x;
                    targetY += sel.refPoint.y;
                }
                targetX *= 1 / selection.length;
                targetY *= 1 / selection.length;
            }
            gameManager.setCenterPosition(new GlobalPoint(targetX, targetY));
            sendClientLocationOptions();
            layerManager.invalidateAllFloors();
        } else if (event.key === "c" && event.ctrlKey) {
            // Ctrl-c - Copy
            copyShapes();
        } else if (event.key === "v" && event.ctrlKey) {
            // Ctrl-v - Paste
            pasteShapes();
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
    const selection = layerManager.getSelection();
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
