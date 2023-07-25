import { baseAdjust } from "../core/http";

import "./events";
import type { Mod } from "./models";

const enabledMods = ["test-mod"];
export const loadedMods: { name: string; mod: Mod }[] = [];

export async function initMods(): Promise<void> {
    for (const modName of enabledMods) {
        try {
            const mod = (await import(/* @vite-ignore */ baseAdjust(`/static/mods/${modName}.js`))) as Mod;
            if (loadedMods.some((m) => m.name === modName)) {
                console.warn(`Mod ${modName} has already been loaded.`);
                continue;
            }
            await handleMod(modName, mod);
        } catch (error) {
            console.error(`Failed to load ${modName} mod`, error);
        }
    }
}

async function handleMod(modName: string, mod: Mod): Promise<void> {
    await mod.init?.();
    loadedMods.push({ name: modName, mod });
}
