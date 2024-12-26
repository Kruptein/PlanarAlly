import type { LocalId } from "../../../core/id";
import { loadedMods } from "../../../mods";

import type { Tracker } from "./models";

interface TrackerEvents {
    updateTracker: (id: LocalId, tracker: Tracker, delta: Partial<Tracker>) => Partial<Tracker>;
}

function updateTracker(id: LocalId, tracker: Tracker, delta: Partial<Tracker>): Partial<Tracker> {
    {
        for (const { mod } of loadedMods) {
            delta = mod.preTrackerUpdate?.(id, tracker, delta) ?? delta;
        }
        return delta;
    }
}

export const trackerEvents: TrackerEvents = {
    updateTracker,
};
