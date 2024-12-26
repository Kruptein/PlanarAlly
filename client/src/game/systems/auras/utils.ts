import type { LocalId } from "../../../core/id";
import { uuidv4 } from "../../../core/utils";

import type { Aura, AuraId, UiAura } from "./models";

export function createEmptyUiAura(shape: LocalId): UiAura {
    return {
        shape,
        temporary: true,
        ...createEmptyAura(),
        name: "New aura",
    };
}

export function createEmptyAura(): Aura {
    return {
        uuid: uuidv4() as unknown as AuraId,
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
