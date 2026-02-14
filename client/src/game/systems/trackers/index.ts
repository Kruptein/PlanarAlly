import { reactive, watchEffect } from "vue";
import type { DeepReadonly, Reactive } from "vue";

import type { ApiCoreShape } from "../../../apiTypes";
import type { LocalId } from "../../../core/id";
import type { Sync } from "../../../core/models/types";
import { registerSystem } from "../../../core/systems";
import type { ShapeSystem, SystemInformMode } from "../../../core/systems/models";
import { uuidv4 } from "../../../core/utils";
import { activeShapeStore } from "../../../store/activeShape";
import { getGlobalId, getShape } from "../../id";

import { partialTrackerToServer, toUiTrackers, trackersFromServer, trackersToServer } from "./conversion";
import { sendShapeCreateTracker, sendShapeRemoveTracker, sendShapeUpdateTracker } from "./emits";
import type { Tracker, TrackerId, UiTracker } from "./models";
import { trackerEvents } from "./mods";
import { createEmptyUiTracker } from "./utils";

interface TrackerState {
    id: LocalId | undefined;
    trackers: UiTracker[];
}

class TrackerSystem implements ShapeSystem<Tracker[]> {
    private data = new Map<LocalId, Tracker[]>();
    private _state: Reactive<TrackerState>;

    constructor() {
        this._state = reactive({
            id: undefined,
            trackers: [],
        });
    }

    // CORE

    clear(): void {
        this.dropState();
        this.data.clear();
    }

    drop(id: LocalId): void {
        this.data.delete(id);
        if (this._state.id === id) {
            this.dropState();
        }
    }

    import(id: LocalId, data: Tracker[], mode: SystemInformMode): void {
        if (data.length === 0) return;

        let newData = data;
        if (mode !== "load") {
            newData = data.map((t) => ({ ...t, uuid: uuidv4() as unknown as TrackerId }));
        }
        this.data.set(id, newData);
    }

    export(id: LocalId): Tracker[] {
        return this.data.get(id) ?? [];
    }

    toServerShape(id: LocalId, data: ApiCoreShape): void {
        const uuid = getGlobalId(id);
        if (uuid === undefined) return;
        data.trackers = trackersToServer(uuid, this.getAll(id));
    }

    fromServerShape(data: ApiCoreShape): Tracker[] {
        return trackersFromServer(...data.trackers);
    }

    // REACTIVE

    get state(): DeepReadonly<Reactive<TrackerState>> {
        return this._state;
    }

    loadState(id: LocalId): void {
        this._state.id = id;
        this.updateTrackerState();
    }

    dropState(): void {
        this._state.id = undefined;
    }

    updateTrackerState(): void {
        const id = this._state.id!;

        const trackers = toUiTrackers(this.data.get(id) ?? [], id);
        trackers.push(createEmptyUiTracker(id));
        this._state.trackers = trackers;
    }

    // BEHAVIOUR

    private getOrCreateForShape(id: LocalId): Tracker[] {
        let idTrackers = this.data.get(id);
        if (idTrackers === undefined) {
            idTrackers = [];
            this.data.set(id, idTrackers);
        }
        return idTrackers;
    }

    get(id: LocalId, trackerId: TrackerId): DeepReadonly<Tracker> | undefined {
        return this.getAll(id).find((t) => t.uuid === trackerId);
    }

    getAll(id: LocalId): DeepReadonly<Tracker[]> {
        return this.data.get(id) ?? [];
    }

    add(id: LocalId, tracker: Tracker, syncTo: Sync): void {
        if (syncTo.server) {
            const gId = getGlobalId(id);
            if (gId) sendShapeCreateTracker(trackersToServer(gId, [tracker])[0]!);
        }

        this.getOrCreateForShape(id).push(tracker);

        if (id === this._state.id) this.updateTrackerState();

        if (tracker.draw) getShape(id)?.invalidate(false);
    }

    update(id: LocalId, trackerId: TrackerId, delta: Partial<Tracker>, syncTo: Sync): void {
        const tracker = this.data.get(id)?.find((t) => t.uuid === trackerId);
        if (tracker === undefined) return;

        delta = trackerEvents.updateTracker(id, tracker, delta, syncTo);

        if (syncTo.server) {
            const shape = getGlobalId(id);
            if (shape)
                sendShapeUpdateTracker({
                    ...partialTrackerToServer({
                        ...delta,
                    }),
                    shape,
                    uuid: trackerId,
                });
        }

        const oldDrawTracker = tracker.draw;

        Object.assign(tracker, delta);

        if (id === this._state.id) this.updateTrackerState();

        if (tracker.draw || oldDrawTracker) getShape(id)?.invalidate(false);
    }

    remove(id: LocalId, trackerId: TrackerId, syncTo: Sync): void {
        if (syncTo.server) {
            const shape = getGlobalId(id);
            if (shape) sendShapeRemoveTracker({ shape, value: trackerId });
        }

        const oldTracker = this.get(id, trackerId);

        this.data.set(id, this.data.get(id)?.filter((tr) => tr.uuid !== trackerId) ?? []);

        if (id === this._state.id) this.updateTrackerState();

        if (oldTracker?.draw === true) getShape(id)?.invalidate(false);
    }
}

export const trackerSystem = new TrackerSystem();
registerSystem("trackers", trackerSystem, true);

// Tracker System state is active whenever a shape is selected due to the quick selection info

watchEffect(() => {
    const id = activeShapeStore.state.id;
    if (id) trackerSystem.loadState(id);
    else trackerSystem.dropState();
});
