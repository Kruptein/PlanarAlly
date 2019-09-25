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
                for (const sel of selection) {
                    if (gameStore.selectionHelperID === sel.uuid) continue;
                    if (sel.movementObstruction)
                        visibilityStore.deleteFromTriag({
                            target: TriangulationTarget.MOVEMENT,
                            shape: sel,
                            standalone: false,
                        });
                    if (sel.visionObstruction)
                        visibilityStore.deleteFromTriag({
                            target: TriangulationTarget.VISION,
                            shape: sel,
                            standalone: false,
                        });
                    sel.refPoint = sel.refPoint.add(delta);
                    if (sel.movementObstruction)
                        visibilityStore.addToTriag({ target: TriangulationTarget.MOVEMENT, shape: sel });
                    if (sel.visionObstruction)
                        visibilityStore.addToTriag({ target: TriangulationTarget.VISION, shape: sel });
                    // todo: Fix again
                    // if (sel.refPoint.x % gridSize !== 0 || sel.refPoint.y % gridSize !== 0) sel.snapToGrid();
                    socket.emit("Shape.Position.Update", { shape: sel.asDict(), redraw: true, temporary: false });
                }
                layerManager.getLayer()!.invalidate(false);
            } else {
                // The pan offsets should be in the opposite direction to give the correct feel.
                gameStore.increasePanX(offsetX * (event.keyCode <= 38 ? 1 : -1));
                gameStore.increasePanY(offsetY * (event.keyCode <= 38 ? 1 : -1));
                layerManager.invalidate();
                sendClientOptions(gameStore.locationOptions);
            }
        } else if (event.key === "d") {
            // d - Deselect all
            const layer = layerManager.getLayer();
            if (layer) {
                layer.clearSelection();
                layer.invalidate(true);
            }
        } else if (event.key === "u" && event.ctrlKey) {
            // Ctrl-u - disable and reenable the Interface
            event.preventDefault();
            event.stopPropagation();
            gameStore.toggleUI();
        } else if (event.key === "c" && event.ctrlKey) {
            // Ctrl-c - Copy
            copyShapes();
        } else if (event.key === "v" && event.ctrlKey) {
            // Ctrl-v - Paste
            pasteShapes();
        }
    }
}
