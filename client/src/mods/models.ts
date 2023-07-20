import type { Component } from "vue";

import { type LocalId } from "../game/id";
import type { IShape } from "../game/interfaces/shape";
import type { SYSTEMS_STATE, System } from "../game/systems";
import type { Tracker } from "../game/systems/trackers/models";

import type { DataBlock, DataBlockSerializer } from "./dataBlocks";

export interface Mod {
    init?: () => Promise<void>;
    initGame?: (data: ModLoad) => Promise<void>;
    loadLocation?: () => Promise<void>;

    preTrackerUpdate?: (id: LocalId, tracker: Tracker, delta: Partial<Tracker>) => Partial<Tracker>;
}

export interface ModLoad {
    systems: Record<string, System>;
    systemsState: typeof SYSTEMS_STATE;

    ui: {
        shape: {
            registerTab: (component: Component, name: string, filter: (shape: LocalId) => boolean) => void;
        };
    };

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
