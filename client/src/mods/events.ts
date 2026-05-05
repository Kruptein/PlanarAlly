import { SYSTEMS, SYSTEMS_STATE } from "../core/systems";
import { getGlobalId, getShape } from "../game/id";
import { registerContextMenuEntry, registerTab } from "../game/systems/ui/mods";

import { getDataBlockFunctions } from "./db";

import { loadedMods, modsLoading } from ".";

async function gameOpened(mods?: (typeof loadedMods.value)[number][]): Promise<void> {
    // It's timing dependent whether the main Game.vue loads before or after the mod info is transferred over the socket
    // So we wait here for the mods to have loaded, to ensure that they all receive the initGame call
    await modsLoading;

    const { activateTool } = await import("../game/tools/tools");
    const { modals } = await import("../core/plugins/modals/plugin");

    const promises: Promise<void>[] = [];
    for (const { id, mod, meta } of mods ?? loadedMods.value) {
        try {
            promises.push(
                Promise.resolve(
                    mod.events?.initGame?.({
                        systems: SYSTEMS,
                        systemsState: SYSTEMS_STATE,
                        ui: {
                        shape: {
                            registerContextMenuEntry,
                            registerTab,
                        },
                        activateTool,
                        modals,
                    },
                        getGlobalId,
                        getShape,
                        ...getDataBlockFunctions(meta.tag),
                    }),
                ),
            );
        } catch (e) {
            console.error("Failed to call initGame on mod", id, "\n", e);
        }
    }
    await Promise.allSettled(promises);
}

async function locationLoaded(mods?: (typeof loadedMods.value)[number][]): Promise<void> {
    await Promise.allSettled(
        (mods ?? loadedMods.value).map(({ mod }) => Promise.resolve(mod.events?.loadLocation?.())),
    );
}

export const modEvents = {
    gameOpened,
    locationLoaded,
};
