export const DEFAULT_CONDITIONS: Conditions = { enabled: [], request: [], disabled: ["default"] };
export type LOGIC_TYPES = "door" | "tp";

export interface DoorRequest {
    logic: "door";
    door: string;
}
export interface TpRequest {
    logic: "tp";
    fromZone: string;
    toZone: string;
    transfers: string[];
}
export type RequestType = DoorRequest | TpRequest;
export type RequestTypeResponse = RequestType & { requester: string };

export interface Conditions {
    enabled: string[];
    request: string[];
    disabled: string[];
}
