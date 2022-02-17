import type { GlobalId, LocalId } from "../../id";

export type AuraId = string & { __brand: "auraId" };

export type UiAura = { shape: LocalId; temporary: boolean } & Aura;

export interface Aura {
    uuid: AuraId;
    active: boolean;
    visionSource: boolean;
    visible: boolean;
    name: string;
    value: number;
    dim: number;
    colour: string;
    borderColour: string;
    angle: number;
    direction: number;
    lastPath?: Path2D;
}

export interface ServerAura {
    shape: GlobalId;
    uuid: AuraId;
    active: boolean;
    vision_source: boolean;
    visible: boolean;
    name: string;
    value: number;
    dim: number;
    colour: string;
    border_colour: string;
    angle: number;
    direction: number;
}
