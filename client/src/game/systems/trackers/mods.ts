import { loadedMods } from "../../../mods";
import type { LocalId } from "../../id";

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
