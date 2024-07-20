import type { LocalId } from "../id";

import type { SystemClearReason } from "./models";

export const SYSTEMS: Record<string, System> = {};
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
(window as any).systems = SYSTEMS;
const SHAPE_SYSTEMS = new Set<string>();
export const SYSTEMS_STATE: Record<string, unknown> = {};
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
(window as any).state = SYSTEMS_STATE;

export function registerSystem(
    key: string,
    system: System,
    isShapeSystem: boolean,
    state?: Record<string, unknown>,
): void {
    SYSTEMS[key] = system;
    if (isShapeSystem) SHAPE_SYSTEMS.add(key);
    if (state !== undefined) SYSTEMS_STATE[key] = state;
}

export function dropFromSystems(id: LocalId): void {
    for (const [key, system] of Object.entries(SYSTEMS)) {
        if (SHAPE_SYSTEMS.has(key)) (system as ShapeSystem).drop(id);
    }
}

export function clearSystems(reason: SystemClearReason): void {
    for (const system of Object.values(SYSTEMS)) {
        system.clear(reason);
    }
}

export interface System {
    clear: (reason: SystemClearReason) => void;
}

export interface ShapeSystem extends System {
    drop: (id: LocalId) => void;
    inform: (id: LocalId, data: any) => void;
}
