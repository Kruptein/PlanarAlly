import { createDataBlock, getDataBlock, getOrLoadDataBlock, loadDataBlock } from "../game/dataBlock";
import type { DBR, DataBlockSerializer, DbRepr, DistributiveOmit } from "../game/dataBlock/models";
import { getShape } from "../game/id";
import { SYSTEMS, SYSTEMS_STATE } from "../game/systems";
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
