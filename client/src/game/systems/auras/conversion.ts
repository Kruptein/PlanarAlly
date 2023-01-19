import type { DeepReadonly } from "vue";

import type { ApiAura } from "../../../apiTypes";
import type { GlobalId, LocalId } from "../../id";

import type { Aura, AuraId, UiAura } from "./models";

export function toUiAuras(auras: readonly Aura[], shape: LocalId): UiAura[] {
    return auras.map((aura) => ({
        ...aura,
        shape,
        temporary: false,
    }));
}

export const aurasFromServer = (...auras: ApiAura[]): Aura[] => {
    const result = [];
    for (const aura of auras) {
        result.push({
            uuid: aura.uuid as AuraId,
            active: aura.active,
            visionSource: aura.vision_source,
            visible: aura.visible,
            name: aura.name,
            value: aura.value,
            dim: aura.dim,
            colour: aura.colour,
            borderColour: aura.border_colour,
            angle: aura.angle,
            direction: aura.direction,
            temporary: false,
        });
    }
    return result;
};

export const aurasToServer = (shape: GlobalId, auras: DeepReadonly<Aura[]>): ApiAura[] => {
    const result = [];
    for (const aura of auras) {
        result.push({
            uuid: aura.uuid,
            active: aura.active,
            vision_source: aura.visionSource,
            visible: aura.visible,
            name: aura.name,
            value: aura.value,
            dim: aura.dim,
            colour: aura.colour,
            border_colour: aura.borderColour,
            angle: aura.angle,
            direction: aura.direction,
            shape,
        });
    }
    return result;
};

export const partialAuraToServer = (aura: Partial<Aura>): Partial<ApiAura> => {
    return {
        uuid: aura.uuid,
        active: aura.active,
        vision_source: aura.visionSource,
        visible: aura.visible,
        name: aura.name,
        value: aura.value,
        dim: aura.dim,
        colour: aura.colour,
        border_colour: aura.borderColour,
        angle: aura.angle,
        direction: aura.direction,
    };
};

export const partialAuraFromServer = (aura: Partial<ApiAura>): Partial<Aura> => {
    const partial: Partial<Aura> = {};
    if ("uuid" in aura) partial.uuid = aura.uuid as AuraId;
    if ("active" in aura) partial.active = aura.active;
    if ("vision_source" in aura) partial.visionSource = aura.vision_source;
    if ("visible" in aura) partial.visible = aura.visible;
    if ("name" in aura) partial.name = aura.name;
    if ("value" in aura) partial.value = aura.value;
    if ("dim" in aura) partial.dim = aura.dim;
    if ("colour" in aura) partial.colour = aura.colour;
    if ("border_colour" in aura) partial.borderColour = aura.border_colour;
    if ("angle" in aura) partial.angle = aura.angle;
    if ("direction" in aura) partial.direction = aura.direction;
    return partial;
};
