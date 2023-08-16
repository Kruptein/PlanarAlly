import { baseAdjust, http } from "../core/http";

import "./events";
import type { Mod } from "./models";

// const enabledMods = ["simple-char-sheet"];
export const loadedMods: { name: string; mod: Mod }[] = [];

export async function initMods(): Promise<void> {
    const modsRequest = await http.get("/api/mods/list");
    if (!modsRequest.ok) {
        console.error("Failed to retrieve list of mods");
        return;
    }
    const mods = (await modsRequest.json()) as { name: string; hasCss: boolean }[];

    for (const { name: modName, hasCss } of mods) {
        try {
            const mod = (await import(/* @vite-ignore */ baseAdjust(`/static/mods/${modName}.js`))) as Mod;
            if (loadedMods.some((m) => m.name === modName)) {
                console.warn(`Mod ${modName} has already been loaded.`);
                continue;
            }
            if (hasCss) createCss(modName);
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

function createCss(modName: string): void {
    const lnk = document.createElement("link");
    lnk.href = baseAdjust(`/static/mods/${modName}.css`);
    lnk.rel = "stylesheet";
    lnk.type = "text/css";

    document.head.appendChild(lnk);
}
