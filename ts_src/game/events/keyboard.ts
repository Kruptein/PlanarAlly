import gameManager from "../manager";
import store from "../../store";

import { sendClientOptions, socket } from "../comm/socket";
import { Vector } from "../geom";
import game from "../game.vue";
import { calculateDelta } from "../ui/tools/utils";

export function onKeyUp(event: KeyboardEvent) {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
    } else {
        if (event.key === "Delete" || event.key === "Del" || event.key === "Backspace") {
            if (gameManager.layerManager.getLayer === undefined) {
                console.log("No active layer selected for delete operation");
                return;
            }
            const l = gameManager.layerManager.getLayer()!;
            for (let i = l.selection.length - 1; i >= 0; i--) {
                const sel = l.selection[i];
                if ((<any>(<any>game).$refs.tools.$refs.selectTool).selectionHelper.uuid === sel.uuid) {
                    l.selection.splice(i, 1);
                    continue;
                }
                l.removeShape(sel, true, false);
                (<any>game).$refs.selectionInfo.shape = null;
                (<any>game).$refs.initiative.removeInitiative(sel.uuid);
            }
        }
    }
}

export function onKeyDown(event: KeyboardEvent) {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        if (event.keyCode === 65 && event.ctrlKey) event.target!.select();
    } else {
        if (event.keyCode >= 37 && event.keyCode <= 40) {
            // todo: this should already be rounded
            const gridSize = Math.round(store.state.game.gridSize);
            let offsetX = gridSize * (event.keyCode % 2);
            let offsetY = gridSize * (event.keyCode % 2 ? 0 : 1);
            if (gameManager.layerManager.hasSelection()) {
                const selection = gameManager.layerManager.getSelection()!;
                offsetX *= event.keyCode <= 38 ? -1 : 1;
                offsetY *= event.keyCode <= 38 ? -1 : 1;
                let delta = new Vector(offsetX, offsetY);
                if (!event.shiftKey || !store.state.game.IS_DM) {
                    // First check for collisions.  Using the smooth wall slide collision check used on mouse move is overkill here.
                    for (const sel of selection) delta = calculateDelta(delta, sel);
                }
                for (const sel of selection) {
                    sel.refPoint.x += delta.x;
                    sel.refPoint.y += delta.y;
                    if (sel.refPoint.x % gridSize !== 0 || sel.refPoint.y % gridSize !== 0) sel.snapToGrid();
                    socket.emit("Shape.Update", { shape: sel.asDict(), redraw: true, temporary: false });
                }
                gameManager.layerManager.getLayer()!.invalidate(false);
            } else {
                // The pan offsets should be in the opposite direction to give the correct feel.
                store.commit("increasePanX", offsetX * (event.keyCode <= 38 ? 1 : -1));
                store.commit("increasePanY", offsetY * (event.keyCode <= 38 ? 1 : -1));
                gameManager.layerManager.invalidate();
                sendClientOptions();
            }
        } else if (event.keyCode === 68) {
            const layer = gameManager.layerManager.getLayer();
            if (layer) {
                layer.clearSelection();
                layer.invalidate(true);
            }
        }
    }
}
