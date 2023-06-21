import type { ApiGroup } from "../../../apiTypes";

export const CREATION_ORDER_OPTIONS: CREATION_ORDER_TYPES[] = ["incrementing", "random"];
export type CREATION_ORDER_TYPES = "incrementing" | "random";

export const CharacterSet = {
    number: "0123456789".split(""),
    latin: "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),
};

export const CHARACTER_SETS = [CharacterSet.number, CharacterSet.latin];

export interface Group {
    uuid: string;
    readonly characterSet: string[];
    readonly creationOrder: CREATION_ORDER_TYPES;
}

export const groupToServer = (group: Group): ApiGroup => ({
    uuid: group.uuid,
    character_set: group.characterSet.join(","),
    creation_order: group.creationOrder,
});

export const groupToClient = (group: ApiGroup): Group => ({
    uuid: group.uuid,
    characterSet: group.character_set.split(","),
    creationOrder: CREATION_ORDER_OPTIONS.includes(group.creation_order as CREATION_ORDER_TYPES)
        ? (group.creation_order as CREATION_ORDER_TYPES)
        : "incrementing",
});
