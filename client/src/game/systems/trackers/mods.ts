import type { LocalId } from "../../../core/id";
import type { Sync } from "../../../core/models/types";
import { loadedMods } from "../../../mods";

import type { Tracker } from "./models";

interface TrackerEvents {
    updateTracker: (id: LocalId, tracker: Tracker, delta: Partial<Tracker>, syncTo: Sync) => Partial<Tracker>;
}

function updateTracker(id: LocalId, tracker: Tracker, delta: Partial<Tracker>, syncTo: Sync): Partial<Tracker> {
    for (const { mod } of loadedMods.value) {
        delta = mod.events?.preTrackerUpdate?.(id, tracker, delta, syncTo) ?? delta;
    }
    return delta;
}

export const trackerEvents: TrackerEvents = {
    updateTracker,
};
