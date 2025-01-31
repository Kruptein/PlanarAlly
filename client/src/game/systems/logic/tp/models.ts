import type { GlobalId } from "../../../../core/id";
import type { Permissions } from "../models";

export interface TeleportOptions {
    permissions: Permissions;
    location?: { id: number; spawnUuid: GlobalId };
    immediate: boolean;
}
