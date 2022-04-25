import { uuidv4 } from "../../../../src/core/utils";
import type { Aura, AuraId } from "../../../../src/game/systems/auras/models";

export function generateTestAuraId(): AuraId {
    return uuidv4() as unknown as AuraId;
}

export function generateTestAura(auraOptions?: Partial<Aura>): Aura {
    return {
        active: true,
        angle: 360,
        borderColour: "rgba(255, 255, 255, 1)",
        colour: "rgba(0, 0, 0, 1)",
        dim: 30,
        value: 30,
        direction: 0,
        name: "Test aura",
        uuid: generateTestAuraId(),
        visible: true,
        visionSource: true,
        ...auraOptions,
    };
}
