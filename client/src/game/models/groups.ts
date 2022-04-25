import type { GlobalId } from "../id";

export const CREATION_ORDER_OPTIONS: CREATION_ORDER_TYPES[] = ["incrementing", "random"];
export type CREATION_ORDER_TYPES = "incrementing" | "random";

export interface ServerGroup {
    uuid: string;
    character_set: string;
    creation_order: string;
}

export interface Group {
    uuid: string;
    readonly characterSet: string[];
    readonly creationOrder: CREATION_ORDER_TYPES;
}

export const groupToServer = (group: Group): ServerGroup => ({
    uuid: group.uuid,
    character_set: group.characterSet.join(","),
    creation_order: group.creationOrder,
});

export const groupToClient = (group: ServerGroup): Group => ({
    uuid: group.uuid,
    characterSet: group.character_set.split(","),
    creationOrder: CREATION_ORDER_OPTIONS.includes(group.creation_order as CREATION_ORDER_TYPES)
        ? (group.creation_order as CREATION_ORDER_TYPES)
        : "incrementing",
});

export type GroupJoinPayload = { group_id: string; members: { uuid: GlobalId; badge: number }[] };
