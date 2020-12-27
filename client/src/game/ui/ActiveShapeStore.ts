/**
 * This is a reactive facade in front of Shape.
 * The current setup causes a bit of code duplication, but this separates the reactive UI aspects from the core game logic.
 *
 * Most of the game shapes will never have a need for being reactive,
 * so the current approach is to use this facade to provide a reactive UI for the active shape.
 *
 * Because this means that things need to be synced between the core Shape and this facade,
 * a SyncTo enum is used to signal direction of events. (i.e. if a change came from the UI or from the core)
 */

import { Module, VuexModule, getModule, Mutation } from "vuex-module-decorators";
import { SyncTo } from "../../core/comm/types";
import { rootStore } from "../../store";
import { layerManager } from "../layers/manager";
import { createEmptyAura } from "../shapes/aura";
import { Aura, Tracker } from "../shapes/interfaces";
import { Shape } from "../shapes/shape";
import { createEmptyTracker } from "../shapes/tracker";

export type UiTracker = { shape: string; temporary: boolean } & Tracker;
export type UiAura = { shape: string; temporary: boolean } & Aura;

// Only expose things that should be available on the UI
export interface ActiveShapeState {
    uuid: string | undefined;
    parentUuid: string | undefined;
    isComposite: boolean;

    trackers: readonly UiTracker[];
    pushTracker(data: { tracker: Tracker; shape: string; syncTo: SyncTo }): void;
    updateTracker(data: { tracker: string; delta: Partial<Tracker>; syncTo: SyncTo }): void;
    removeTracker(data: { tracker: string; syncTo: SyncTo }): void;

    auras: readonly UiAura[];
    pushAura(data: { aura: Aura; shape: string; syncTo: SyncTo }): void;
    updateAura(data: { aura: string; delta: Partial<Aura>; syncTo: SyncTo }): void;
    removeAura(data: { aura: string; syncTo: SyncTo }): void;
}

function toUiTrackers(trackers: readonly Tracker[], shape: string): UiTracker[] {
    return trackers.map(tracker => ({
        shape,
        temporary: false,
        ...tracker,
    }));
}

function toUiAuras(auras: readonly Aura[], shape: string): UiAura[] {
    return auras.map(aura => ({
        shape,
        temporary: false,
        ...aura,
    }));
}

@Module({ dynamic: true, store: rootStore, name: "activeShape", namespaced: true })
class ActiveShapeStore extends VuexModule implements ActiveShapeState {
    private _uuid: string | undefined;
    private _parentUuid: string | undefined;

    private _trackers: UiTracker[] = [];
    private firstRealTrackerIndex = 0;

    private _auras: UiAura[] = [];
    private firstRealAuraIndex = 0;

    get uuid(): string | undefined {
        return this._uuid;
    }

    get parentUuid(): string | undefined {
        return this._parentUuid;
    }

    get isComposite(): boolean {
        return this._parentUuid !== undefined;
    }

    // TRACKERS

    get trackers(): readonly UiTracker[] {
        return this._trackers;
    }

    @Mutation
    pushTracker(data: { tracker: Tracker; shape: string; syncTo: SyncTo }): void {
        const tracker = toUiTrackers([data.tracker], data.shape)[0];
        if (this._uuid === data.shape) {
            this._trackers.splice(this._trackers.length - 1, 0, tracker);
        } else if (this._parentUuid === data.shape) {
            this._trackers.splice(this.firstRealTrackerIndex, 0, tracker);
            this.firstRealTrackerIndex += 1;
        } else {
            return;
        }
        if (data.syncTo !== SyncTo.UI) {
            const shape = layerManager.UUIDMap.get(data.shape)!;
            shape.pushTracker(data.tracker, data.syncTo);
        }
    }

    @Mutation
    updateTracker(data: { tracker: string; delta: Partial<Tracker>; syncTo: SyncTo }): void {
        const tracker = this._trackers.find(t => t.uuid === data.tracker);
        if (tracker === undefined) return;

        Object.assign(tracker, data.delta);

        const shape = layerManager.UUIDMap.get(tracker.shape);
        if (shape === undefined) return;

        if (data.syncTo !== SyncTo.UI) {
            if (tracker.temporary) {
                tracker.temporary = false;
                shape.pushTracker(tracker, SyncTo.SERVER);
                this._trackers.push(createEmptyTracker(this._uuid!));
            } else {
                shape.updateTracker(data.tracker, data.delta, data.syncTo);
            }
        }
    }

    @Mutation
    removeTracker(data: { tracker: string; syncTo: SyncTo }): void {
        const trackerIndex = this._trackers.findIndex(t => t.uuid === data.tracker);
        if (trackerIndex < 0) return;

        const tracker = this._trackers.splice(trackerIndex, 1)[0];
        if (trackerIndex < this.firstRealTrackerIndex) {
            this.firstRealTrackerIndex -= 1;
        }

        const shape = layerManager.UUIDMap.get(tracker.shape);
        if (shape === undefined) return;

        if (data.syncTo !== SyncTo.UI) shape.removeTracker(data.tracker, data.syncTo);
    }

    // AURAS

    get auras(): readonly UiAura[] {
        return this._auras;
    }

    @Mutation
    pushAura(data: { aura: Aura; shape: string; syncTo: SyncTo }): void {
        const aura = toUiAuras([data.aura], data.shape)[0];
        if (this._uuid === data.shape) {
            this._auras.splice(this._auras.length - 1, 0, aura);
        } else if (this._parentUuid === data.shape) {
            this._auras.splice(this.firstRealAuraIndex, 0, aura);
            this.firstRealAuraIndex += 1;
        } else {
            return;
        }
        if (data.syncTo !== SyncTo.UI) {
            const shape = layerManager.UUIDMap.get(data.shape)!;
            shape.pushAura(data.aura, data.syncTo);
        }
    }

    @Mutation
    updateAura(data: { aura: string; delta: Partial<Aura>; syncTo: SyncTo }): void {
        const aura = this._auras.find(a => a.uuid === data.aura);
        if (aura === undefined) return;

        Object.assign(aura, data.delta);

        const shape = layerManager.UUIDMap.get(aura.shape);
        if (shape === undefined) return;

        if (data.syncTo !== SyncTo.UI) {
            if (aura.temporary) {
                aura.temporary = false;
                shape.pushAura(aura, SyncTo.SERVER);
                this._auras.push(createEmptyAura(this._uuid!));
            } else {
                shape.updateAura(data.aura, data.delta, data.syncTo);
            }
        }
    }

    @Mutation
    removeAura(data: { aura: string; syncTo: SyncTo }): void {
        const auraIndex = this._auras.findIndex(t => t.uuid === data.aura);
        if (auraIndex < 0) return;

        const aura = this._auras.splice(auraIndex, 1)[0];
        if (auraIndex < this.firstRealAuraIndex) {
            this.firstRealAuraIndex -= 1;
        }

        const shape = layerManager.UUIDMap.get(aura.shape);
        if (shape === undefined) return;

        if (data.syncTo !== SyncTo.UI) shape.removeAura(data.aura, data.syncTo);
    }

    // STARTUP / CLEANUP

    @Mutation
    setActiveShape(shape: Shape): void {
        this._uuid = shape.uuid;
        const parent = layerManager.getCompositeParent(shape.uuid);
        this._parentUuid = parent?.uuid;
        this._trackers = [];
        this._auras = [];
        if (parent !== undefined) {
            this._trackers.push(...toUiTrackers(parent.getTrackers(false), parent.uuid));
            this.firstRealTrackerIndex = this._trackers.length;
            this._auras.push(...toUiAuras(parent.getAuras(false), parent.uuid));
            this.firstRealAuraIndex = this._auras.length;
        }
        this._trackers.push(...toUiTrackers(shape.getTrackers(false), shape.uuid));
        this._trackers.push(createEmptyTracker(this._uuid));
        this._auras.push(...toUiAuras(shape.getAuras(false), shape.uuid));
        this._auras.push(createEmptyAura(this._uuid));
    }

    @Mutation
    clear(): void {
        this._uuid = undefined;
        this._parentUuid = undefined;
        this.firstRealTrackerIndex = 0;
        this._trackers = [];
        this._auras = [];
    }
}

export const activeShapeStore = getModule(ActiveShapeStore);
