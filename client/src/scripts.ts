/**
 * This file is destined for utility functions / scripts that can be ran manually in the webconsole by for example the DM.
 */

import { sendShapeSizeUpdate, sendShapePositionUpdate } from "./game/api/emits/shape/core";
import { GlobalPoint } from "./game/geom";
import { layerManager } from "./game/layers/manager";
import { floorStore } from "./game/layers/store";
import { BaseRect } from "./game/shapes/variants/baserect";
import { Circle } from "./game/shapes/variants/circle";
import { Line } from "./game/shapes/variants/line";
import { Polygon } from "./game/shapes/variants/polygon";
import { gameStore } from "./game/store";
import { visibilityStore } from "./game/visibility/store";

/**
 * This function rescales all objects on the map
 *
 * @param factor the ratio used to rescale shape axis by
 */
function rescale(factor: number, sync: boolean): void {
    if (!Number.isFinite(factor)) {
        console.error("Provided factor is not a valid number.");
        return;
    }
    if (sync === undefined) sync = false;
    if (!gameStore.IS_DM) {
        console.warn("You must be a DM to perform this operation.");
        return;
    }
    const shapes = [...layerManager.UUIDMap.values()];
    for (const shape of shapes) {
        if (shape.preventSync) continue;
        (shape as any)._refPoint = new GlobalPoint(shape.refPoint.x * factor, shape.refPoint.y * factor);

        if (shape.type === "rect" || shape.type === "assetrect") {
            (shape as BaseRect).w *= factor;
            (shape as BaseRect).h *= factor;
        } else if (shape.type === "circle" || shape.type === "circulartoken") {
            (shape as Circle).r *= factor;
        } else if (shape.type === "line") {
            (shape as Line).endPoint = new GlobalPoint(
                (shape as Line).endPoint.x * factor,
                (shape as Line).endPoint.y * factor,
            );
        } else if (shape.type === "polygon") {
            (shape as Polygon)._vertices = (shape as Polygon)._vertices.map(
                (v) => new GlobalPoint(v.x * factor, v.y * factor),
            );
        }
        if (sync && shape.type !== "polygon") sendShapeSizeUpdate({ shape, temporary: false });
    }
    for (const floor of floorStore.floors) {
        visibilityStore.recalculateVision(floor.id);
        visibilityStore.recalculateMovement(floor.id);
    }
    layerManager.invalidateAllFloors();
    if (sync) {
        sendShapePositionUpdate(shapes, false);
        console.log("Changes should be synced now. Refresh your page to make sure everything works accordingly.");
    } else {
        console.log(
            "If everything looks ok and you want to sync these changes to the server, hard refresh your page and rerun the script with the sync parameter set to true. e.g. rescale(5/7, true)",
        );
    }
}

export function registerScripts(): void {
    (window as any).rescale = rescale;
}
