import { SYSTEMS, SYSTEMS_STATE } from "../core/systems";
import { getGlobalId, getShape } from "../game/id";
import { registerContextMenuEntry, registerTab } from "../game/systems/ui/mods";

import { getDataBlockFunctions } from "./db";

import { loadedMods } from ".";

const ui = {
    shape: {
        registerContextMenuEntry,
        registerTab,
    },
};

async function gameOpened(mods?: (typeof loadedMods.value)[number][]): Promise<void> {
    for (const { id, mod, meta } of mods ?? loadedMods.value) {
        try {
            await mod.events?.initGame?.({
                systems: SYSTEMS,
                systemsState: SYSTEMS_STATE,
                ui,
                getGlobalId,
                getShape,
                ...getDataBlockFunctions(meta.tag),
            });
        } catch (e) {
            console.error("Failed to call initGame on mod", id, "\n", e);
        }
    }
}

async function locationLoaded(mods?: (typeof loadedMods.value)[number][]): Promise<void> {
    for (const { mod } of mods ?? loadedMods.value) await mod.events?.loadLocation?.();
}

export const modEvents = {
    gameOpened,
    locationLoaded,
};
