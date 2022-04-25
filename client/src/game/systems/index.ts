import type { LocalId } from "../id";

const SYSTEMS: Record<string, System> = {};
(window as any).systems = SYSTEMS;

export function registerSystem(key: string, system: System): void {
    SYSTEMS[key] = system;
}

export function dropFromSystems(id: LocalId): void {
    for (const system of Object.values(SYSTEMS)) {
        system.drop(id);
    }
}

export function clearSystems(): void {
    for (const system of Object.values(SYSTEMS)) {
        system.clear();
    }
}

export interface System {
    clear(): void;
    drop(id: LocalId): void;
    inform(id: LocalId, data: any): void;
}
