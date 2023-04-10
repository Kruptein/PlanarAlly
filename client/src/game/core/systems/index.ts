import { HAS_WORKER } from "../../messages/supported";
import type { LocalId } from "../id";

const SYSTEMS: Record<string, System> = {};
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
(self as any).systems = SYSTEMS;
const SHAPE_SYSTEMS = new Set<string>();
const STATE: Record<string, unknown> = {};
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
(self as any).state = STATE;

export function registerSystem(
    key: string,
    system: System,
    isShapeSystem: boolean,
    state?: Record<string, unknown>,
    isUiSystem = false,
): void {
    if (("document" in self && HAS_WORKER) === !isUiSystem) {
        console.error(`System initialization in ${isUiSystem ? "worker" : "UI"} context detected (${key})`);
    }
    SYSTEMS[key] = system;
    if (isShapeSystem) SHAPE_SYSTEMS.add(key);
    if (state !== undefined) STATE[key] = state;
}

export function dropFromSystems(id: LocalId): void {
    for (const [key, system] of Object.entries(SYSTEMS)) {
        if (SHAPE_SYSTEMS.has(key)) (system as ShapeSystem).drop(id);
    }
}

export function clearSystems(partial: boolean): void {
    for (const system of Object.values(SYSTEMS)) {
        system.clear(partial);
    }
}

export interface System {
    clear: (partial: boolean) => void;
}

export interface ShapeSystem extends System {
    drop: (id: LocalId) => void;
    inform: (id: LocalId, data: any) => void;
}
