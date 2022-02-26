import type { LocalId } from "../id";

const SYSTEMS: Record<string, System> = {};

export function registerSystem(key: string, system: System): void {
    SYSTEMS[key] = system;
}

export interface System {
    clear(): void;
    inform(id: LocalId, data: any): void;
}

(window as any).systems = SYSTEMS;
