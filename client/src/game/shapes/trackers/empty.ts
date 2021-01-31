import { uuidv4 } from "../../../core/utils";
import { UiAura, UiTracker } from "../../ui/ActiveShapeStore";
import { Aura, Tracker } from "../interfaces";

export function createEmptyUiTracker(shape: string): UiTracker {
    return {
        shape,
        temporary: true,
        ...createEmptyTracker(),
    };
}

export function createEmptyTracker(): Tracker {
    return {
        uuid: uuidv4(),
        name: "",
        value: 0,
        maxvalue: 0,
        visible: false,
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
