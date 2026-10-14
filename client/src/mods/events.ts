import { buildModApi } from "./hostApi";

import type { LoadedMod } from ".";
import { loadedMods, modsLoading } from ".";

async function gameOpened(mods?: LoadedMod[]): Promise<void> {
    // Game.vue and the room mod list race each other, so wait until the list has been applied.
    await modsLoading;

    const pending = (mods ?? loadedMods.value).filter((entry) => !entry.gameStarted);
    for (const entry of pending) entry.gameStarted = true;
    await Promise.allSettled(
        pending.map(async (entry) => {
            try {
                const api = await buildModApi(entry.id, entry.meta.tag);
                await entry.mod.events?.initGame?.(api);
            } catch (error) {
                console.error("Failed to call initGame on mod", entry.id, "\n", error);
            }
        }),
    );
}

async function locationLoaded(mods?: LoadedMod[]): Promise<void> {
    await Promise.allSettled(
        (mods ?? loadedMods.value).map(({ mod }) => Promise.resolve(mod.events?.loadLocation?.())),
    );
}

export const modEvents = {
    gameOpened,
    locationLoaded,
};
