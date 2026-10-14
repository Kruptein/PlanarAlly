import type { Mod } from "@planarally/mod-api";

import { clearRegistrations } from "./registry";

export async function shutdownMod(mod: Mod, modId: string): Promise<void> {
    try {
        await mod.events?.dispose?.();
    } catch (error) {
        console.error(`Failed to dispose mod ${modId}`, error);
    }
    clearRegistrations(modId);
}
