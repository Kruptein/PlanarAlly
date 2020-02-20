import { layerManager } from "@/game/layers/manager";
import { visibilityStore } from "./store";
import { TriangulationTarget } from "./te/pa";

export function getBlockers(target: TriangulationTarget, floor?: string): readonly string[] {
    if (floor === undefined) floor = layerManager.floor!.name;
    const blockers =
        target === TriangulationTarget.VISION ? visibilityStore.visionBlockers : visibilityStore.movementBlockers;
    return blockers.find(vb => vb.floor === floor)?.blockers || [];
}

export function getVisionSources(floor?: string): readonly { shape: string; aura: string }[] {
    if (floor === undefined) floor = layerManager.floor!.name;
    return visibilityStore.visionSources.find(vs => vs.floor === floor)?.sources || [];
}

export function setVisionSources(sources: { shape: string; aura: string }[], floor?: string): void {
    if (floor === undefined) floor = layerManager.floor!.name;
    const obj = visibilityStore.visionSources.find(vs => vs.floor === floor);
    if (obj === undefined) throw new Error("setVisionSources got an unknown floor");
    obj.sources = sources;
}

function setBlockers(target: TriangulationTarget, blockers: string[], floor?: string): void {
    if (floor === undefined) floor = layerManager.floor!.name;
    const targetBlockers =
        target === TriangulationTarget.VISION ? visibilityStore.visionBlockers : visibilityStore.movementBlockers;
    const obj = targetBlockers.find(b => b.floor === floor);
    if (obj === undefined) throw new Error("setBlockers got an unknown floor");
    obj.blockers = blockers;
}

export function sliceVisionSources(index: number, floor?: string): void {
    const sources = getVisionSources(floor);
    setVisionSources([...sources.slice(0, index), ...sources.slice(index + 1)], floor);
}

export function sliceBlockers(target: TriangulationTarget, index: number, floor?: string): void {
    const blockers = getBlockers(target, floor);
    setBlockers(target, [...blockers.slice(0, index), ...blockers.slice(index + 1)], floor);
}

export function addVisionSource(source: { shape: string; aura: string }, floor?: string): void {
    const sources = getVisionSources(floor);
    setVisionSources([...sources, source], floor);
}

export function addBlocker(target: TriangulationTarget, blocker: string, floor?: string): void {
    const blockers = getBlockers(target, floor);
    setBlockers(target, [...blockers, blocker], floor);
}

export function moveBlocker(target: TriangulationTarget, blocker: string, oldFloor: string, newFloor: string): void {
    sliceBlockers(
        target,
        getBlockers(target, oldFloor).findIndex(shape => shape === blocker),
        oldFloor,
    );
    addBlocker(target, blocker, newFloor);
}

export function moveVisionSource(source: string, auras: Aura[], oldFloor: string, newFloor: string): void {
    for (const aura of auras) {
        if (!aura.visionSource) continue;
        sliceVisionSources(
            getVisionSources(oldFloor).findIndex(s => s.shape === source && s.aura === aura.uuid),
            oldFloor,
        );
        addVisionSource({ shape: source, aura: aura.uuid }, newFloor);
    }
}
