import type { LocalId } from "../../../core/id";

export type TrackerId = string & { __brand: "trackerId" };

export interface Tracker {
    uuid: TrackerId;
    visible: boolean;
    name: string;
    value: number;
    maxvalue: number;
    draw: boolean;
    primaryColor: string;
    secondaryColor: string;
}

export type UiTracker = { shape: LocalId; temporary: boolean } & Tracker;

import type { Sync } from "../../../core/models/types";

declare module "../../../core/eventBus" {
    interface EventMap {
        "tracker:added": { id: LocalId; tracker: Tracker; syncTo: Sync };
        "tracker:updated": { id: LocalId; trackerId: TrackerId; delta: Partial<Tracker>; syncTo: Sync };
        "tracker:removed": { id: LocalId; trackerId: TrackerId; syncTo: Sync };
    }
}

declare module "../../../core/hooks" {
    interface HookMap {
        "pre:tracker:update": {
            args: { id: LocalId; tracker: Tracker; syncTo: Sync };
            value: Partial<Tracker>;
        };
    }
}
