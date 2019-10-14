import { layerManager } from "@/game/layers/manager";
import { visibilityStore } from "../store";
import { CDT } from "./cdt";

export enum TriangulationTarget {
    VISION = "vision",
    MOVEMENT = "movement",
}

export let PA_CDT = {
    vision: new CDT(),
    movement: new CDT(),
};

export function triangulate(target: TriangulationTarget, partial: boolean = false): void {
    const cdt = new CDT();
    PA_CDT[target] = cdt;
    let shapes;
    if (target === "vision") shapes = visibilityStore.visionBlockers;
    else shapes = visibilityStore.movementblockers;

    for (const sh of shapes) {
        const shape = layerManager.UUIDMap.get(sh)!;
        if (partial && !shape.visibleInCanvas(layerManager.getLayer()!.canvas)) continue;
        const j = shape.isClosed ? 0 : 1;
        for (let i = 0; i < shape.points.length - j; i++) {
            cdt.insertConstraint(shape.points[i], shape.points[(i + 1) % shape.points.length]);
        }
    }
    // LEFT WALL
    cdt.insertConstraint([-1e8, -1e8], [-1e8, 1e8]);
    cdt.insertConstraint([-1e8, 1e8], [-1e11, 1e8]);
    cdt.insertConstraint([-1e11, 1e8], [-1e11, -1e8]);
    cdt.insertConstraint([-1e11, -1e8], [-1e8, -1e8]);
    // TOP WALL
    cdt.insertConstraint([-1e8, -1e8], [1e8, -1e8]);
    cdt.insertConstraint([1e8, -1e8], [1e8, -1e11]);
    cdt.insertConstraint([1e8, -1e11], [-1e8, -1e11]);
    cdt.insertConstraint([-1e8, -1e11], [-1e8, -1e8]);
    // RIGHT WALL
    cdt.insertConstraint([1e8, -1e8], [1e8, 1e8]);
    cdt.insertConstraint([1e8, 1e8], [1e11, 1e8]);
    cdt.insertConstraint([1e11, 1e8], [1e11, -1e8]);
    cdt.insertConstraint([1e11, -1e8], [1e8, -1e8]);
    // BOT WALL
    cdt.insertConstraint([-1e8, 1e8], [1e8, 1e8]);
    cdt.insertConstraint([1e8, 1e8], [1e8, 1e11]);
    cdt.insertConstraint([1e8, 1e11], [-1e8, 1e11]);
    cdt.insertConstraint([-1e8, 1e11], [-1e8, 1e8]);
    (<any>window).CDT = PA_CDT;
}
