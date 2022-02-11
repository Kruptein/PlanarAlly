import type { Global, LocalId } from "../id";

export const DEFAULT_CONDITIONS: Conditions = { enabled: [], request: [], disabled: ["default"] };
export type LOGIC_TYPES = "door" | "tp";

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

export interface Conditions {
    enabled: string[];
    request: string[];
    disabled: string[];
}
