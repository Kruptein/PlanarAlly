import type { LocalId } from "../../../core/id";
import { uuidv4 } from "../../../core/utils";

import type { Tracker, TrackerId, UiTracker } from "./models";

export function createEmptyUiTracker(shape: LocalId): UiTracker {
    return {
        shape,
        temporary: true,
        ...createEmptyTracker(),
        name: "New tracker",
    };
}

export function createEmptyTracker(): Tracker {
    return {
        uuid: uuidv4() as unknown as TrackerId,
        name: "",
        value: 0,
        maxvalue: 0,
        visible: false,
        draw: false,
        primaryColor: "#00FF00",
        secondaryColor: "#888888",
    };
}
