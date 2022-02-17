import type { GlobalId, LocalId } from "../../../id";
import type { Permissions } from "../models";

export interface TpRequest {
    logic: "tp";
    fromZone: LocalId;
    toZone: LocalId;
    transfers: LocalId[];
}

export interface TeleportOptions {
    permissions: Permissions;
    location?: { id: number; spawnUuid: GlobalId };
    immediate: boolean;
}
