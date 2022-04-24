import type { DeepReadonly } from "vue";

import { coreStore } from "../../../store/core";
import { gameStore } from "../../../store/game";
import type { LocalId } from "../../id";

import { doorSystem } from "./door";
import { Access, DEFAULT_PERMISSIONS } from "./models";
import type { Permissions } from "./models";
import type { LOGIC_TYPES } from "./models";
import { teleportZoneSystem } from "./tp";

export function copyPermissions(permission: DeepReadonly<Permissions>): Permissions {
    return {
        enabled: [...permission.enabled],
        request: [...permission.request],
        disabled: [...permission.disabled],
    };
}

export function canUse(shapeId: LocalId, target: LOGIC_TYPES): Access {
    if (
        (target === "door" && !doorSystem.isDoor(shapeId)) ||
        (target === "tp" && !teleportZoneSystem.isTeleportZone(shapeId))
    ) {
        return Access.Disabled;
    }
    if (!gameStore.state.isDm) {
        const permissions =
            target === "door"
                ? doorSystem.getPermissions(shapeId)
                : teleportZoneSystem.getPermissions(shapeId) ?? DEFAULT_PERMISSIONS();
        if (permissions === undefined) return Access.Disabled;

        // First specific user permissions
        const username = coreStore.state.username;
        if (permissions.enabled.includes(username)) return Access.Enabled;
        if (permissions.request.includes(username)) return Access.Request;
        if (permissions.disabled.includes(username)) return Access.Disabled;

        // Check default permissions
        if (permissions.enabled.includes("default")) return Access.Enabled;
        if (permissions.request.includes("default")) return Access.Request;
        if (permissions.disabled.includes("default")) return Access.Disabled;
    }
    return Access.Enabled;
}
