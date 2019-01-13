import { layerManager } from "@/game/layers/manager";
import { gameStore } from "@/game/store";

import { CDT } from "./cdt";

export let PA_CDT = new CDT();

export function triangulate(partial: boolean = false) {
    const cdt = new CDT();
    for (const sh of gameStore.visionBlockers) {
        const shape = layerManager.UUIDMap.get(sh)!;
        if (partial && !shape.visibleInCanvas(layerManager.getLayer()!.canvas)) continue;
        for (let i = 0; i < shape.points.length; i++) {
            cdt.insertConstraint(shape.points[i], shape.points[(i + 1) % shape.points.length]);
        }
    }
    PA_CDT = cdt;
    (<any>window).CDT = PA_CDT;
}
