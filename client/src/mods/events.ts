import { getShape } from "../game/id";
import { SYSTEMS, SYSTEMS_STATE } from "../game/systems";
import { registerTab } from "../game/systems/ui/mods";

import type { DataBlockSerializer } from "./dataBlocks";
import { createDataBlock, getDataBlock, getOrLoadDataBlock, loadDataBlock } from "./dataBlocks";

import { loadedMods } from ".";

const ui = {
    shape: {
        registerTab,
    },
};

async function gameOpened(): Promise<void> {
    for (const { mod, name: modName } of loadedMods) {
        try {
            await mod.initGame?.({
                systems: SYSTEMS,
                systemsState: SYSTEMS_STATE,
                ui,
                getShape,
                getDataBlock,
                createDataBlock,
                loadDataBlock: <D extends Record<string, unknown>, S extends Record<string, unknown>>(
                    name: string,
                    serializer: DataBlockSerializer<D, S>,
                    defaultData?: () => D,
                ) => loadDataBlock<D, S>(modName, name, serializer, defaultData),
                getOrLoadDataBlock: <D extends Record<string, unknown>, S extends Record<string, unknown>>(
                    name: string,
                    serializer: DataBlockSerializer<D, S>,
                    defaultData?: () => D,
                ) => getOrLoadDataBlock<D, S>(modName, name, serializer, defaultData),
            });
        } catch {
            console.error("Failed to call initGame on mod", modName);
        }
    }
}

async function locationLoaded(): Promise<void> {
    for (const { mod } of loadedMods) await mod.loadLocation?.();
}

export const modEvents = {
    gameOpened,
    locationLoaded,
};
