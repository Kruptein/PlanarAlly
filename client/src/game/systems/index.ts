const SYSTEMS: Record<string, any> = {};

export function registerSystem(key: string, system: any): void {
    SYSTEMS[key] = system;
}

(window as any).systems = SYSTEMS;
