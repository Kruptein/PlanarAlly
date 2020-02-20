import { layerManager } from "@/game/layers/manager";
import { getBlockers } from "@/game/visibility/utils";
import { CDT } from "./cdt";
import { visibilityStore } from "../store";

export enum TriangulationTarget {
    VISION = "vision",
    MOVEMENT = "movement",
}

const PA_CDT: Map<string, { vision: CDT; movement: CDT }> = new Map();

export function getCDT(target: TriangulationTarget, floor: string): CDT {
    return PA_CDT.get(floor)![target];
}

function setCDT(target: TriangulationTarget, cdt: CDT, floor: string): void {
    PA_CDT.set(floor, { ...PA_CDT.get(floor)!, [target]: cdt });
}

export function addCDT(floor: string): void {
    PA_CDT.set(floor, { vision: new CDT(), movement: new CDT() });
    visibilityStore.movementBlockers.push({ floor, blockers: [] });
    visibilityStore.visionBlockers.push({ floor, blockers: [] });
    visibilityStore.visionSources.push({ floor, sources: [] });
}

export function removeCDT(floor: string): void {
    PA_CDT.delete(floor);
}

export function triangulate(target: TriangulationTarget, partial = false, floor: string): void {
    const cdt = new CDT();
    setCDT(target, cdt, floor);
    const shapes = getBlockers(target, floor);

    for (const sh of shapes) {
        const shape = layerManager.UUIDMap.get(sh)!;
        if (shape.floor !== floor) continue;
        if (partial && !shape.visibleInCanvas(layerManager.getLayer(floor)!.canvas)) continue;
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
