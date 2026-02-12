import type { LocalId } from "../../../core/id";
import { uuidv4 } from "../../../core/utils";

import type { Aura, AuraId, UiAura } from "./models";

export function generateAuraId(): AuraId {
    return uuidv4() as unknown as AuraId;
}

export function createEmptyUiAura(shape: LocalId): UiAura {
    return {
        shape,
        temporary: true,
        ...createEmptyAura(),
        name: "New aura",
    };
}

function createEmptyAura(): Aura {
    return {
        uuid: generateAuraId(),
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
