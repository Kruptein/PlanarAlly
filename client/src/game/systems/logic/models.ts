import type { Global } from "../../id";

import type { DoorRequest } from "./door/models";
import type { TpRequest } from "./tp/models";

export const DEFAULT_PERMISSIONS: () => Permissions = () => ({ enabled: [], request: [], disabled: ["default"] });
export type LOGIC_TYPES = "door" | "tp";

export enum Access {
    Enabled,
    Request,
    Disabled,
}

type RequestType = DoorRequest | TpRequest;
export type RequestTypeResponse = Global<RequestType> & { requester: string };

export interface Permissions {
    enabled: string[];
    request: string[];
    disabled: string[];
}
