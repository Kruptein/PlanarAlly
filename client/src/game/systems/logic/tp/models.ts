import type { GlobalId } from "../../../id";
import type { Permissions } from "../models";

export interface TeleportOptions {
    permissions: Permissions;
    location?: { id: number; spawnUuid: GlobalId };
    immediate: boolean;
}
