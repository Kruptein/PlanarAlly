import { ServerAura } from "@/game/comm/types/shapes";
import { Aura } from "../../shapes/interfaces";

export const aurasFromServer = (...auras: ServerAura[]): Aura[] => {
    const result = [];
    for (const aura of auras) {
        result.push({
            uuid: aura.uuid,
            visionSource: aura.vision_source,
            visible: aura.visible,
            name: aura.name,
            value: aura.value,
            dim: aura.dim,
            colour: aura.colour,
            temporary: false,
        });
    }
    return result;
};

export const aurasToServer = (shape: string, auras: Aura[]): ServerAura[] => {
    const result = [];
    for (const aura of auras) {
        result.push({
            uuid: aura.uuid,
            vision_source: aura.visionSource,
            visible: aura.visible,
            name: aura.name,
            value: aura.value,
            dim: aura.dim,
            colour: aura.colour,
            shape,
        });
    }
    return result;
};

export const partialAuraToServer = (aura: Partial<Aura>): Partial<ServerAura> => {
    return {
        uuid: aura.uuid,
        vision_source: aura.visionSource,
        visible: aura.visible,
        name: aura.name,
        value: aura.value,
        dim: aura.dim,
        colour: aura.colour,
    };
};

export const partialAuraFromServer = (aura: Partial<ServerAura>): Partial<Aura> => {
    const partial: Partial<Aura> = {};
    if ("uuid" in aura) partial.uuid = aura.uuid;
    if ("vision_source" in aura) partial.visionSource = aura.vision_source;
    if ("visible" in aura) partial.visible = aura.visible;
    if ("name" in aura) partial.name = aura.name;
    if ("value" in aura) partial.value = aura.value;
    if ("dim" in aura) partial.dim = aura.dim;
    if ("colour" in aura) partial.colour = aura.colour;
    return partial;
};
