import { initiativeStore } from "./store";

export function inInitiative(uuid: string): boolean {
    return initiativeStore.data.some(d => d.uuid === uuid);
}
