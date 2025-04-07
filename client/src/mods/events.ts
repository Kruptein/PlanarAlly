import { SYSTEMS, SYSTEMS_STATE } from "../core/systems";
import type { DistributiveOmit } from "../core/types";
import { createDataBlock, getDataBlock, getOrLoadDataBlock, loadDataBlock } from "../game/dataBlock";
import type { DBR, DataBlockSerializer, DbRepr } from "../game/dataBlock/models";
import { getGlobalId, getShape } from "../game/id";
import { registerContextMenuEntry, registerTab, registerTrackerSettings } from "../game/systems/ui/mods";

import { loadedMods } from ".";

const ui = {
    shape: {
        registerContextMenuEntry,
        registerTab,
        registerTrackerSettings,
    },
};

async function gameOpened(mods?: (typeof loadedMods.value)[number][]): Promise<void> {
    for (const { id, mod, meta } of mods ?? loadedMods.value) {
        try {
            await mod.initGame?.({
                systems: SYSTEMS,
                systemsState: SYSTEMS_STATE,
                ui,
                getGlobalId,
                getShape,
                getDataBlock,
                createDataBlock,
                loadDataBlock: <D extends DBR, S extends DBR>(
                    repr: DistributiveOmit<DbRepr, "source">,
                    serializer: DataBlockSerializer<D, S>,
                    options?: { createOnServer?: boolean; defaultData?: () => D },
                ) => loadDataBlock<D, S>({ ...repr, source: meta.tag }, serializer, options),
                getOrLoadDataBlock: <D extends DBR, S extends DBR>(
                    repr: DistributiveOmit<DbRepr, "source">,
                    serializer: DataBlockSerializer<D, S>,
                    options?: { createOnServer?: boolean; defaultData?: () => D },
                ) => getOrLoadDataBlock<D, S>({ ...repr, source: meta.tag }, serializer, options),
            });
        } catch (e) {
            console.error("Failed to call initGame on mod", id, "\n", e);
        }
    }
}

async function locationLoaded(mods?: (typeof loadedMods.value)[number][]): Promise<void> {
    for (const { mod } of mods ?? loadedMods.value) await mod.loadLocation?.();
}

export const modEvents = {
    gameOpened,
    locationLoaded,
};
