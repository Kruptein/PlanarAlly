import type { LocalId } from "../../../core/id";
import { loadedMods } from "../../../mods";

import type { Tracker } from "./models";

interface TrackerEvents {
    updateTracker: (id: LocalId, tracker: Tracker, delta: Partial<Tracker>) => Partial<Tracker>;
}

function updateTracker(id: LocalId, tracker: Tracker, delta: Partial<Tracker>): Partial<Tracker> {
    {
        for (const { mod } of loadedMods.value) {
            delta = mod.events?.preTrackerUpdate?.(id, tracker, delta) ?? delta;
        }
        return delta;
    }
}

export const trackerEvents: TrackerEvents = {
    updateTracker,
};
