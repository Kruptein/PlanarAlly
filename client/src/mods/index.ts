import { ref } from "vue";

import type { ApiModMeta } from "../apiTypes";
import { baseAdjust } from "../core/http";
import { sendGetRoomMods } from "../game/api/emits/mods";

import "./events";
import type { Mod } from "./models";

// const enabledMods = ["simple-char-sheet"];
export const loadedMods = ref<{ id: string; meta: ApiModMeta; mod: Mod }[]>([]);

export async function loadMod(meta: ApiModMeta): Promise<{ id: string; meta: ApiModMeta; mod: Mod } | undefined> {
    const id = `${meta.tag}-${meta.version}-${meta.hash}`;
    try {
        const mod = (await import(/* @vite-ignore */ baseAdjust(`/static/mods/${id}/index.js`))) as Mod;
        if (loadedMods.value.some((m) => m.id === id)) {
            console.warn(`Mod ${id} has already been loaded.`);
            return;
        }
        if (meta.hasCss) createCss(id);
        await handleMod(id, meta, mod);
        return { id, meta, mod };
    } catch (error) {
        console.error(`Failed to load ${id} mod`, error);
    }
}

export async function loadRoomMods(): Promise<void> {
    const mods = await sendGetRoomMods();

    for (const modMeta of mods) {
        await loadMod(modMeta);
    }
}

async function handleMod(modId: string, modMeta: ApiModMeta, mod: Mod): Promise<void> {
    await mod.init?.(modMeta);
    loadedMods.value.push({ id: modId, meta: modMeta, mod });
}

function createCss(modId: string): void {
    const lnk = document.createElement("link");
    lnk.href = baseAdjust(`/static/mods/${modId}/index.css`);
    lnk.rel = "stylesheet";
    lnk.type = "text/css";

    document.head.appendChild(lnk);
}
