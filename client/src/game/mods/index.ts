import { toRef, type Component, type Ref } from "vue";

import { baseAdjust } from "../../core/http";
import { getShape, type LocalId } from "../id";
import type { IShape } from "../interfaces/shape";
import { SYSTEMS, SYSTEMS_STATE } from "../systems";
import { accessState } from "../systems/access/state";
import type { Tracker } from "../systems/trackers/models";

import type { DataBlock, DataBlockSerializer } from "./dataBlocks";
import { createDataBlock, getDataBlock, getOrLoadDataBlock, loadDataBlock } from "./dataBlocks";

export const charTabs: { component: Component; name: string; filter: (shape: number) => boolean }[] = [];

const enabledMods = ["test-mod"];
const loadedMods: { name: string; mod: Mod }[] = [];

interface Mod {
    MOD_ID: string;
    type: "CharTab";
    charTab: { component: Component; name: string; filter: (shape: number) => boolean };
    onTrackerUpdate: (
        id: LocalId,
        tracker: Tracker,
        delta: Partial<Tracker>,
    ) => { abort: boolean; delta: Partial<Tracker> };
}

interface ModLoad {
    activeShape: Ref<LocalId | undefined>;
    systems: typeof SYSTEMS;
    systemsState: typeof SYSTEMS_STATE;

    getShape: (shape: LocalId) => IShape | undefined;

    getOrLoadDataBlock: <D extends Record<string, unknown>, S extends Record<string, unknown>>(
        name: string,
        serializer: DataBlockSerializer<D, S>,
        defaultData?: () => D,
    ) => Promise<DataBlock<D, S> | undefined>;
    loadDataBlock: <D extends Record<string, unknown>, S extends Record<string, unknown>>(
        name: string,
        serializer: DataBlockSerializer<D, S>,
        defaultData?: () => D,
    ) => Promise<DataBlock<D, S> | undefined>;
    createDataBlock: <D extends Record<string, unknown>, S extends Record<string, unknown>>(
        source: string,
        name: string,
        data: D,
        serializer: DataBlockSerializer<D, S>,
    ) => Promise<DataBlock<D, S>>;
    getDataBlock: <D extends Record<string, unknown>, S extends Record<string, unknown>>(
        source: string,
        name: string,
    ) => DataBlock<D, S> | undefined;
}

export async function initMods(): Promise<void> {
    for (const modName of enabledMods) {
        try {
            const mod = (await import(baseAdjust(`/static/mods/${modName}.js`))) as {
                init: (data: ModLoad) => Promise<Mod>;
            };
            if (loadedMods.some((m) => m.name === modName)) {
                console.error(`Mod ${modName} has already been loaded.`);
                continue;
            }
            handleMod(
                modName,
                await mod.init({
                    activeShape: toRef(accessState.reactive, "id"),
                    systems: SYSTEMS,
                    systemsState: SYSTEMS_STATE,
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
                }),
            );
        } catch (error) {
            console.error(`Failed to load ${modName} mod`, error);
        }
    }
}

function handleMod(modName: string, mod: Mod): void {
    loadedMods.push({ name: modName, mod });
    charTabs.push(mod.charTab);
}

export function modTrigger(
    id: LocalId,
    tracker: Tracker,
    delta: Partial<Tracker>,
): { abort: boolean; delta: Partial<Tracker> } {
    for (const { mod } of loadedMods) {
        const ret = mod.onTrackerUpdate(id, tracker, delta);
        if (ret.abort) return ret;
        delta = { ...delta, ...ret.delta };
    }
    return { abort: false, delta };
}
