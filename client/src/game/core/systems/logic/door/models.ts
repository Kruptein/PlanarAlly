import type { Permissions } from "../models";

export type DOOR_TOGGLE_MODE = "movement" | "vision" | "both";
export const DOOR_TOGGLE_MODES: DOOR_TOGGLE_MODE[] = ["vision", "movement", "both"];

export interface DoorOptions {
    permissions?: Permissions;
    toggleMode: DOOR_TOGGLE_MODE;
}
