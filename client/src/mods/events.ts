import { SYSTEMS, SYSTEMS_STATE } from "../core/systems";
import type { DistributiveOmit } from "../core/types";
import { createDataBlock, getDataBlock, getOrLoadDataBlock, loadDataBlock } from "../game/dataBlock";
import type { DBR, DataBlockSerializer, DbRepr } from "../game/dataBlock/models";
import { getGlobalId, getShape } from "../game/id";
import { registerTab, registerTrackerSettings } from "../game/systems/ui/mods";

import { loadedMods } from ".";

const ui = {
    shape: {
        registerTab,
        registerTrackerSettings,
    },
};

async function gameOpened(): Promise<void> {
    for (const { mod, name: modName } of loadedMods) {
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
                ) => loadDataBlock<D, S>({ ...repr, source: modName }, serializer, options),
                getOrLoadDataBlock: <D extends DBR, S extends DBR>(
                    repr: DistributiveOmit<DbRepr, "source">,
                    serializer: DataBlockSerializer<D, S>,
                    options?: { createOnServer?: boolean; defaultData?: () => D },
                ) => getOrLoadDataBlock<D, S>({ ...repr, source: modName }, serializer, options),
            });
        } catch (e) {
            console.error("Failed to call initGame on mod", modName, "\n", e);
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
