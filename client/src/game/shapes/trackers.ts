import { uuidv4 } from "../../core/utils";
import type { UiAura, UiTracker } from "../../store/activeShape";

import type { Aura, Tracker } from "./interfaces";

export function createEmptyUiTracker(shape: string): UiTracker {
    return {
        shape,
        temporary: true,
        ...createEmptyTracker(),
        name: "New tracker",
    };
}

export function createEmptyTracker(): Tracker {
    return {
        uuid: uuidv4(),
        name: "",
        value: 0,
        maxvalue: 0,
        visible: false,
        draw: false,
        primaryColor: "#00FF00",
        secondaryColor: "#888888",
    };
}

export function createEmptyUiAura(shape: string): UiAura {
    return {
        shape,
        temporary: true,
        ...createEmptyAura(),
        name: "New aura",
    };
}

export function createEmptyAura(): Aura {
    return {
        uuid: uuidv4(),
        active: false,
        name: "",
        value: 0,
        dim: 0,
        visionSource: false,
        colour: "rgba(0,0,0,0)",
        borderColour: "rgba(0,0,0,0)",
        angle: 360,
        direction: 0,
        visible: false,
    };
}
