import gameManager from "../planarally";
import { SelectTool } from "../tools/select";
import { Vector } from "../geom";
import Settings from "../settings";
import { sendClientOptions, socket } from "../socket";

function targetIsInput(e: Event) {
    if (e.target && (<HTMLElement>e.target).tagName)
        return ["INPUT", "TEXTAREA"].includes((<HTMLElement>e.target).tagName);
    return false;
}

export function onKeyUp (event: KeyboardEvent) {
    if ((event.key == "Delete" || event.key == 'Del') && !targetIsInput(event)) {
        if (gameManager.layerManager.getLayer === undefined) {
            console.log("No active layer selected for delete operation");
            return;
        }
        const l = gameManager.layerManager.getLayer()!;
        for(let i=l.selection.length - 1; i >= 0; i--) {
            const sel = l.selection[i];
            l.removeShape(sel, true, false);
            gameManager.initiativeTracker.removeInitiative(sel.uuid, true, false);
        }
    }
}

export function onKeyDown (event: KeyboardEvent) {
    // The arrow keys codes:           37: left   38: up  39: right  40:down
    if (!targetIsInput(event) && event.keyCode >= 37 && event.keyCode <= 40) {
        // todo: this should already be rounded
        const gridSize = Math.round(Settings.gridSize);
        let x_offset = gridSize * (event.keyCode % 2);
        let y_offset = gridSize * (event.keyCode % 2 ? 0 : 1);
        if (gameManager.layerManager.hasSelection()) {
            const selection = gameManager.layerManager.getSelection()!;
            x_offset *= (event.keyCode <= 38 ? -1 : 1);
            y_offset *= (event.keyCode <= 38 ? -1 : 1);
            let collision = false;
            if (!event.shiftKey || !Settings.IS_DM) {
                // First check for collisions.  Using the smooth wall slide collision check used on mouse move is overkill here.
                for (let i=0; i<selection.length && !collision; i++) {
                    const sel = selection[i];
                    if (sel.uuid === (<SelectTool>gameManager.tools.get("select")!).selectionHelper.uuid)
                        continue;
                    const newSelBBox = sel.getBoundingBox().offset(new Vector(x_offset, y_offset));
                    for (let mb = 0; mb < gameManager.movementblockers.length; mb++) {
                        const blocker = gameManager.layerManager.UUIDMap.get(gameManager.movementblockers[mb])!;
                        const blockerBBox = blocker.getBoundingBox();
                        // Check if the bounding box of our destination would intersect with the bounding box of the movementblocker
                        if (blockerBBox.intersectsWithInner(newSelBBox)) {
                            collision = true;
                            break;
                        }
                    }
                }
            }
            if (!collision) {
                for (let i=0; i<selection.length; i++) {
                    const sel = selection[i];
                    sel.refPoint.x += x_offset;
                    sel.refPoint.y += y_offset;
                    socket.emit("shapeMove", { shape: sel.asDict(), temporary: false });
                }
                gameManager.layerManager.getLayer()!.invalidate(false);
            }
        } else {
            // The pan offsets should be in the opposite direction to give the correct feel.
            Settings.panX += x_offset * (event.keyCode <= 38 ? 1 : -1);
            Settings.panY += y_offset * (event.keyCode <= 38 ? 1 : -1);
            gameManager.layerManager.invalidate();
            sendClientOptions();
        }
    } else if (event.keyCode == 68 && !targetIsInput(event)) {
        const layer = gameManager.layerManager.getLayer();
        if (layer) {
            layer.selection = [];
            layer.invalidate(true);
        }
    }
};