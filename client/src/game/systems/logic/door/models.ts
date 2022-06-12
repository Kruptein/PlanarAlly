import type { LocalId } from "../../../id";
import type { Permissions } from "../models";

export interface DoorRequest {
    logic: "door";
    door: LocalId;
}

export type DOOR_TOGGLE_MODE = "movement" | "vision" | "both";
export const DOOR_TOGGLE_MODES: DOOR_TOGGLE_MODE[] = ["vision", "movement", "both"];

export interface DoorOptions {
    permissions?: Permissions;
    toggleMode: DOOR_TOGGLE_MODE;
}
