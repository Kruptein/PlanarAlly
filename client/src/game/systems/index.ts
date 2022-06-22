import type { LocalId } from "../id";

const SYSTEMS: Record<string, System> = {};
(window as any).systems = SYSTEMS;
const SHAPE_SYSTEMS: Set<string> = new Set();

export function registerSystem(key: string, system: System, isShapeSystem: boolean): void {
    SYSTEMS[key] = system;
    if (isShapeSystem) SHAPE_SYSTEMS.add(key);
}

export function dropFromSystems(id: LocalId): void {
    for (const [key, system] of Object.entries(SYSTEMS)) {
        if (SHAPE_SYSTEMS.has(key)) (system as ShapeSystem).drop(id);
    }
}

export function clearSystems(): void {
    for (const system of Object.values(SYSTEMS)) {
        system.clear();
    }
}

export interface System {
    clear(): void;
}

export interface ShapeSystem extends System {
    drop(id: LocalId): void;
    inform(id: LocalId, data: any): void;
}
