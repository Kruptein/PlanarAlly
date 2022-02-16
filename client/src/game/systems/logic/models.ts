import type { Global, GlobalId, LocalId } from "../../id";

export const DEFAULT_PERMISSIONS: Permissions = { enabled: [], request: [], disabled: ["default"] };
export type LOGIC_TYPES = "door" | "tp";

export enum Access {
    Enabled,
    Request,
    Disabled,
}

export interface DoorRequest {
    logic: "door";
    door: LocalId;
}
export interface TpRequest {
    logic: "tp";
    fromZone: LocalId;
    toZone: LocalId;
    transfers: LocalId[];
}
export type RequestType = DoorRequest | TpRequest;
export type RequestTypeResponse = Global<RequestType> & { requester: string };

export interface Permissions {
    enabled: string[];
    request: string[];
    disabled: string[];
}

export interface TeleportOptions {
    permissions: Permissions;
    location?: { id: number; spawnUuid: GlobalId };
    immediate: boolean;
}
