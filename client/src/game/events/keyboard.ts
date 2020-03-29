import { socket } from "@/game/api/socket";
import { sendClientOptions } from "@/game/api/utils";
import { Vector } from "@/game/geom";
import { layerManager } from "@/game/layers/manager";
import { copyShapes, deleteShapes, pasteShapes } from "@/game/shapes/utils";
import { gameStore } from "@/game/store";
import { calculateDelta } from "@/game/ui/tools/utils";
import { visibilityStore } from "@/game/visibility/store";
import { TriangulationTarget } from "@/game/visibility/te/pa";

export function onKeyUp(event: KeyboardEvent): void {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        // no-op (condition is cleaner this way)
    } else {
        if (event.key === "Delete" || event.key === "Del" || event.key === "Backspace") {
            deleteShapes();
        }
    }
}

export function onKeyDown(event: KeyboardEvent): void {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        // Ctrl-a with a HTMLInputElement or a HTMLTextAreaElement selected - select all the text
        if (event.key === "a" && event.ctrlKey) event.target!.select();
    } else {
        if (event.keyCode >= 37 && event.keyCode <= 40) {
            // Arrow keys - move the selection or the camera
            // todo: this should already be rounded
            const gridSize = Math.round(gameStore.gridSize);
            let offsetX = gridSize * (event.keyCode % 2);
            let offsetY = gridSize * (event.keyCode % 2 ? 0 : 1);
            if (layerManager.hasSelection()) {
                const selection = layerManager.getSelection()!;
                offsetX *= event.keyCode <= 38 ? -1 : 1;
                offsetY *= event.keyCode <= 38 ? -1 : 1;
                let delta = new Vector(offsetX, offsetY);
                if (!event.shiftKey || !gameStore.IS_DM) {
                    // First check for collisions.  Using the smooth wall slide collision check used on mouse move is overkill here.
                    for (const sel of selection) {
                        if (gameStore.selectionHelperID === sel.uuid) continue;
                        delta = calculateDelta(delta, sel);
                    }
                }
                if (delta.length() === 0) return;
                let recalculateVision = false;
                let recalculateMovement = false;
                for (const sel of selection) {
                    if (!sel.ownedBy()) continue;
                    if (gameStore.selectionHelperID === sel.uuid) continue;
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
                    socket.emit("Shape.Position.Update", {
                        shape: sel.asDict(),
                        redraw: true,
                        temporary: false,
                    });
                }
                const floorName = layerManager.floor!.name;
                if (recalculateVision) visibilityStore.recalculateVision(floorName);
                if (recalculateMovement) visibilityStore.recalculateMovement(floorName);
                layerManager.getLayer(layerManager.floor!.name)!.invalidate(false);
            } else {
                // The pan offsets should be in the opposite direction to give the correct feel.
                gameStore.increasePanX(offsetX * (event.keyCode <= 38 ? 1 : -1));
                gameStore.increasePanY(offsetY * (event.keyCode <= 38 ? 1 : -1));
                layerManager.invalidateAllFloors();
                sendClientOptions(gameStore.locationOptions);
            }
        } else if (event.key === "d") {
            // d - Deselect all
            layerManager.clearSelection();
        } else if (event.key === "u" && event.ctrlKey) {
            // Ctrl-u - disable and reenable the Interface
            event.preventDefault();
            event.stopPropagation();
            gameStore.toggleUI();
        } else if (event.key === "0" && event.ctrlKey) {
            // Ctrl-0 - Re-center/reset the viewport
            gameStore.setPanX(0);
            gameStore.setPanY(0);
            sendClientOptions(gameStore.locationOptions);
            layerManager.invalidateAllFloors();
        } else if (event.key === "c" && event.ctrlKey) {
            // Ctrl-c - Copy
            copyShapes();
        } else if (event.key === "v" && event.ctrlKey) {
            // Ctrl-v - Paste
            pasteShapes();
        } else if (event.key === "PageUp" && gameStore.selectedFloorIndex < gameStore.floors.length - 1) {
            // Page Up - Move floor up
            // Ctrl + Page Up - Move selected shapes floor up
            // Ctrl + Shift + Page Up - Move selected shapes floor up AND move floor up
            event.preventDefault();
            if (gameStore.selectedFloorIndex + 1 >= gameStore.floors.length) return;
            const selection = layerManager.getSelection() ?? [];
            const newFloor = gameStore.floors[gameStore.selectedFloorIndex + 1];
            const newLayer = layerManager.getLayer(newFloor)!;

            if (event.ctrlKey) {
                for (const shape of selection) {
                    shape.moveFloor(newFloor, true);
                }
            }
            if (!event.shiftKey) layerManager.clearSelection();
            if (!event.ctrlKey || event.shiftKey) {
                gameStore.selectFloor(gameStore.selectedFloorIndex + 1);
            }
            if (event.shiftKey) for (const shape of selection) newLayer.selection.push(shape);
        } else if (event.key === "PageDown" && gameStore.selectedFloorIndex > 0) {
            // Page Down - Move floor down
            // Ctrl + Page Down - Move selected shape floor down
            // Ctrl + Shift + Page Down - Move selected shapes floor down AND move floor down
            event.preventDefault();
            if (gameStore.selectedFloorIndex - 1 < 0) return;
            const selection = layerManager.getSelection() ?? [];
            const newFloor = gameStore.floors[gameStore.selectedFloorIndex - 1];
            const newLayer = layerManager.getLayer(newFloor)!;

            if (event.ctrlKey) {
                for (const shape of selection) {
                    shape.moveFloor(newFloor, true);
                }
            }
            if (!event.shiftKey) layerManager.clearSelection();
            if (!event.ctrlKey || event.shiftKey) {
                gameStore.selectFloor(gameStore.selectedFloorIndex - 1);
            }
            if (event.shiftKey) for (const shape of selection) newLayer.selection.push(shape);
        }
    }
}
