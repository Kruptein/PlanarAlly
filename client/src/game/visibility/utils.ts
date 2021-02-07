import { Aura } from "../shapes/interfaces";
import { Shape } from "../shapes/shape";

import { visibilityStore } from "./store";
import { TriangulationTarget } from "./te/pa";

export function getBlockers(target: TriangulationTarget, floor: number): readonly string[] {
    const blockers =
        target === TriangulationTarget.VISION ? visibilityStore.visionBlockers : visibilityStore.movementBlockers;
    return blockers.find((vb) => vb.floor === floor)?.blockers || [];
}

export function getVisionSources(floor: number): readonly { shape: string; aura: string }[] {
    return visibilityStore.visionSources.find((vs) => vs.floor === floor)?.sources || [];
}

export function setVisionSources(sources: { shape: string; aura: string }[], floor: number): void {
    const obj = visibilityStore.visionSources.find((vs) => vs.floor === floor);
    if (obj === undefined) throw new Error("setVisionSources got an unknown floor");
    obj.sources = sources;
}

function setBlockers(target: TriangulationTarget, blockers: string[], floor: number): void {
    const targetBlockers =
        target === TriangulationTarget.VISION ? visibilityStore.visionBlockers : visibilityStore.movementBlockers;
    const obj = targetBlockers.find((b) => b.floor === floor);
    if (obj === undefined) throw new Error("setBlockers got an unknown floor");
    obj.blockers = blockers;
}

export function sliceVisionSources(index: number, floor: number): void {
    const sources = getVisionSources(floor);
    setVisionSources([...sources.slice(0, index), ...sources.slice(index + 1)], floor);
}

export function sliceBlockers(target: TriangulationTarget, index: number, floor: number, recalculate: boolean): void {
    const blockers = getBlockers(target, floor);
    const shape = blockers[index];
    setBlockers(target, [...blockers.slice(0, index), ...blockers.slice(index + 1)], floor);
    if (recalculate) {
        visibilityStore.deleteFromTriag({
            target,
            shape,
        });
        visibilityStore.recalculate({ target, floor });
    }
}

export function addVisionSource(source: { shape: string; aura: string }, floor: number): void {
    const sources = getVisionSources(floor);
    setVisionSources([...sources, source], floor);
}

export function addBlocker(target: TriangulationTarget, blocker: string, floor: number, recalculate: boolean): void {
    const blockers = getBlockers(target, floor);
    setBlockers(target, [...blockers, blocker], floor);
    if (recalculate) {
        visibilityStore.addToTriag({ target, shape: blocker });
        visibilityStore.recalculate({ target, floor });
    }
}

export function moveBlocker(
    target: TriangulationTarget,
    blocker: string,
    oldFloor: number,
    newFloor: number,
    recalculate: boolean,
): void {
    sliceBlockers(
        target,
        getBlockers(target, oldFloor).findIndex((shape) => shape === blocker),
        oldFloor,
        recalculate,
    );
    addBlocker(target, blocker, newFloor, recalculate);
}

export function moveVisionSource(source: string, auras: readonly Aura[], oldFloor: number, newFloor: number): void {
    for (const aura of auras) {
        if (!aura.visionSource) continue;
        sliceVisionSources(
            getVisionSources(oldFloor).findIndex((s) => s.shape === source && s.aura === aura.uuid),
            oldFloor,
        );
        addVisionSource({ shape: source, aura: aura.uuid }, newFloor);
    }
}

export function removeBlocker(target: TriangulationTarget, floor: number, shape: Shape, recalculate: boolean): void {
    const blockers = getBlockers(target, floor);
    const index = blockers.findIndex((ls) => ls === shape.uuid);
    if (index >= 0) {
        sliceBlockers(target, index, floor, recalculate);
    }
}

export function removeVisionSources(floor: number, shape: string): boolean {
    const sources = getVisionSources(floor);
    const index = sources.findIndex((ls) => ls.shape === shape);
    if (index >= 0) sliceVisionSources(index, floor);
    return index >= 0;
}
