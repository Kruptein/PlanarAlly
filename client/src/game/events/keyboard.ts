import { uuidv4 } from "@/core/utils";
import { socket } from "@/game/api/socket";
import { sendClientOptions } from "@/game/api/utils";
import { ServerAura } from "@/game/comm/types/shapes";
import { EventBus } from "@/game/event-bus";
import { Vector } from "@/game/geom";
import { layerManager } from "@/game/layers/manager";
import { createShapeFromDict } from "@/game/shapes/utils";
import { gameStore } from "@/game/store";
import { calculateDelta } from "@/game/ui/tools/utils";
import { visibilityStore } from "@/game/visibility/store";

export function onKeyUp(event: KeyboardEvent): void {
    if (!(event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)) {
        if (event.key === "Delete" || event.key === "Del" || event.key === "Backspace") {
            if (layerManager.getLayer === undefined) {
                console.log("No active layer selected for delete operation");
                return;
            }
            const l = layerManager.getLayer()!;
            for (let i = l.selection.length - 1; i >= 0; i--) {
                const sel = l.selection[i];
                if (gameStore.selectionHelperID === sel.uuid) {
                    l.selection.splice(i, 1);
                    continue;
                }
                l.removeShape(sel, true, false);
                EventBus.$emit("SelectionInfo.Shape.Set", null);
                EventBus.$emit("Initiative.Remove", sel.uuid);
            }
        }
    }
}

export function onKeyDown(event: KeyboardEvent): void {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        if (event.keyCode === 65 && event.ctrlKey) event.target!.select();
    } else {
        if (event.keyCode >= 37 && event.keyCode <= 40) {
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
                for (const sel of selection) {
                    if (gameStore.selectionHelperID === sel.uuid) continue;
                    sel.refPoint = sel.refPoint.add(delta);
                    // todo: Fix again
                    // if (sel.refPoint.x % gridSize !== 0 || sel.refPoint.y % gridSize !== 0) sel.snapToGrid();
                    socket.emit("Shape.Position.Update", { shape: sel.asDict(), redraw: true, temporary: false });
                }
                visibilityStore.recalculateVision();
                layerManager.getLayer()!.invalidate(false);
            } else {
                // The pan offsets should be in the opposite direction to give the correct feel.
                gameStore.increasePanX(offsetX * (event.keyCode <= 38 ? 1 : -1));
                gameStore.increasePanY(offsetY * (event.keyCode <= 38 ? 1 : -1));
                layerManager.invalidate();
                sendClientOptions(gameStore.locationOptions);
            }
        } else if (event.keyCode === 68) {
            const layer = layerManager.getLayer();
            if (layer) {
                layer.clearSelection();
                layer.invalidate(true);
            }
        } else if (event.key === "u" && event.ctrlKey) {
            event.preventDefault();
            event.stopPropagation();
            gameStore.toggleUI();
        } else if (event.key === "c" && event.ctrlKey) {
            const layer = layerManager.getLayer();
            if (!layer) return;
            if (!layer.selection) return;
            const clipboard = [];
            for (const shape of layer.selection) {
                if (gameStore.selectionHelperID === shape.uuid) continue;
                clipboard.push(shape.asDict());
            }
            gameStore.setClipboard(clipboard);
        } else if (event.key === "v" && event.ctrlKey) {
            const layer = layerManager.getLayer();
            if (!layer) return;
            if (!gameStore.clipboard) return;
            layer.selection = [];
            for (const clip of gameStore.clipboard) {
                clip.x += 10;
                clip.y += 10;
                clip.uuid = uuidv4();
                const oldTrackers = clip.trackers;
                clip.trackers = [];
                for (const tracker of oldTrackers) {
                    const newTracker: Tracker = {
                        ...tracker,
                        uuid: uuidv4(),
                    };
                    clip.trackers.push(newTracker);
                }
                const oldAuras = clip.auras;
                clip.auras = [];
                for (const aura of oldAuras) {
                    const newAura: ServerAura = {
                        ...aura,
                        uuid: uuidv4(),
                    };
                    clip.auras.push(newAura);
                }
                const shape = createShapeFromDict(clip);
                if (shape === undefined) continue;
                layer.addShape(shape, true);
                layer.selection.push(shape);
            }
            if (layer.selection.length === 1) EventBus.$emit("SelectionInfo.Shape.Set", layer.selection[0]);
            else EventBus.$emit("SelectionInfo.Shape.Set", null);
            layer.invalidate(false);
        }
    }
}
