import { sendClientOptions } from "@/game/api/utils";
import { Vector } from "@/game/geom";
import { layerManager } from "@/game/layers/manager";
import { copyShapes, deleteShapes, pasteShapes } from "@/game/shapes/utils";
import { gameStore } from "@/game/store";
import { calculateDelta } from "@/game/ui/tools/utils";
import { visibilityStore } from "@/game/visibility/store";
import { TriangulationTarget } from "@/game/visibility/te/pa";
import { EventBus } from "../event-bus";
import { gameManager } from "../manager";
import { gameSettingsStore } from "../settings";
import { floorStore } from "../layers/store";
import { moveFloor } from "../layers/utils";
import { sendShapePositionUpdate } from "../api/events/shape";

export function onKeyUp(event: KeyboardEvent): void {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        // no-op (condition is cleaner this way)
    } else {
        if (event.key === "Delete" || event.key === "Del" || event.key === "Backspace") {
            deleteShapes();
        }
        if (event.key === " ") {
            const tokens = gameStore.ownedtokens.map(o => layerManager.UUIDMap.get(o)!);
            if (tokens.length === 0) return;
            const i = tokens.findIndex(o => o.center().equals(gameStore.screenCenter));
            const token = tokens[(i + 1) % tokens.length];
            gameManager.setCenterPosition(token.center());
            floorStore.selectFloor({ targetFloor: token.floor.name, sync: true });
        }
    }
}

export function onKeyDown(event: KeyboardEvent): void {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        // Ctrl-a with a HTMLInputElement or a HTMLTextAreaElement selected - select all the text
        if (event.key === "a" && event.ctrlKey) event.target.select();
    } else {
        if (event.keyCode >= 37 && event.keyCode <= 40) {
            // Arrow keys - move the selection or the camera
            // todo: this should already be rounded
            const gridSize = Math.round(gameSettingsStore.gridSize);
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

                const floorName = floorStore.currentFloor.name;
                if (recalculateVision) visibilityStore.recalculateVision(floorName);
                if (recalculateMovement) visibilityStore.recalculateMovement(floorName);
                floorStore.currentLayer!.invalidate(false);
            } else {
                // The pan offsets should be in the opposite direction to give the correct feel.
                gameStore.increasePanX(offsetX * (event.keyCode <= 38 ? 1 : -1));
                gameStore.increasePanY(offsetY * (event.keyCode <= 38 ? 1 : -1));
                layerManager.invalidateAllFloors();
                sendClientOptions(gameStore.locationUserOptions);
            }
        } else if (event.key === "d") {
            // d - Deselect all
            layerManager.clearSelection();
        } else if (event.key === "l" && event.ctrlKey) {
            const selection = layerManager.getSelection() ?? [];
            for (const shape of selection) {
                shape.isLocked = !shape.isLocked;
            }
            event.preventDefault();
            event.stopPropagation();
        } else if (event.key === "u" && event.ctrlKey) {
            // Ctrl-u - disable and reenable the Interface
            event.preventDefault();
            event.stopPropagation();
            gameStore.toggleUI();
        } else if (event.key === "0" && event.ctrlKey) {
            // Ctrl-0 - Re-center/reset the viewport
            gameStore.setPanX(0);
            gameStore.setPanY(0);
            sendClientOptions(gameStore.locationUserOptions);
            layerManager.invalidateAllFloors();
        } else if (event.key === "c" && event.ctrlKey) {
            // Ctrl-c - Copy
            copyShapes();
        } else if (event.key === "v" && event.ctrlKey) {
            // Ctrl-v - Paste
            pasteShapes();
        } else if (event.key === "PageUp" && floorStore.currentFloorindex < floorStore.floors.length - 1) {
            // Page Up - Move floor up
            // Ctrl + Page Up - Move selected shapes floor up
            // Ctrl + Shift + Page Up - Move selected shapes floor up AND move floor up
            event.preventDefault();
            const targetFloor = floorStore.floors.findIndex(
                (f, i) => i > floorStore.currentFloorindex && (gameStore.IS_DM || f.playerVisible),
            );
            if (targetFloor > floorStore.floors.length - 1) return;

            const selection = layerManager.getSelection() ?? [];
            const newFloor = floorStore.floors[targetFloor];
            const newLayer = layerManager.getLayer(newFloor)!;

            if (event.ctrlKey) {
                moveFloor([...selection], newFloor, true);
            }
            layerManager.clearSelection();
            if (!event.ctrlKey || event.shiftKey) {
                floorStore.selectFloor({ targetFloor, sync: true });
            }
            if (event.shiftKey) for (const shape of selection) newLayer.pushSelection(shape);
        } else if (event.key === "PageDown" && floorStore.currentFloorindex > 0) {
            // Page Down - Move floor down
            // Ctrl + Page Down - Move selected shape floor down
            // Ctrl + Shift + Page Down - Move selected shapes floor down AND move floor down
            event.preventDefault();
            const maxLength = floorStore.floors.length - 1;
            let targetFloor = [...floorStore.floors]
                .reverse()
                .findIndex(
                    (f, i) => maxLength - i < floorStore.currentFloorindex && (gameStore.IS_DM || f.playerVisible),
                );
            targetFloor = maxLength - targetFloor;
            if (targetFloor < 0) return;

            const selection = layerManager.getSelection() ?? [];
            const newFloor = floorStore.floors[targetFloor];
            const newLayer = layerManager.getLayer(newFloor)!;

            if (event.ctrlKey) {
                moveFloor([...selection], newFloor, true);
            }
            if (!event.shiftKey) layerManager.clearSelection();
            if (!event.ctrlKey || event.shiftKey) {
                floorStore.selectFloor({ targetFloor, sync: true });
            }
            if (event.shiftKey) for (const shape of selection) newLayer.pushSelection(shape);
        } else if (event.key === "Tab") {
            event.preventDefault();
            EventBus.$emit("ToolMode.Toggle");
        }
    }
}
