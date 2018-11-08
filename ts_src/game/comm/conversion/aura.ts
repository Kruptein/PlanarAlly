import { ServerAura } from "../types/shapes";

export const aurasFromServer = (auras: ServerAura[]): Aura[] => {
    const result = [];
    for (const aura of auras) {
        result.push({
            uuid: aura.uuid,
            visionSource: aura.vision_source,
            visible: aura.visible,
            name: aura.name,
            value: aura.value,
            dim: aura.dim,
            colour: aura.colour
        })
    }
    return result;
}

export const aurasToServer = (auras: Aura[]): ServerAura[] => {
    const result = [];
    for (const aura of auras) {
        result.push({
            uuid: aura.uuid,
            vision_source: aura.visionSource,
            visible: aura.visible,
            name: aura.name,
            value: aura.value,
            dim: aura.dim,
            colour: aura.colour
        })
    }
    return result;
}