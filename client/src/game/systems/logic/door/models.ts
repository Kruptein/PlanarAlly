import type { LocalId } from "../../../id";

export interface DoorRequest {
    logic: "door";
    door: LocalId;
}
