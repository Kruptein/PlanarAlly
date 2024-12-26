import type { DeepReadonly } from "vue";

import type { LocalId } from "../../../core/id";
import { Role } from "../../models/role";
import { playerSystem } from "../players";
import type { PlayerId } from "../players/models";

import { doorSystem } from "./door";
import { Access, DEFAULT_PERMISSIONS } from "./models";
import type { LOGIC_TYPES, Permissions } from "./models";
import { teleportZoneSystem } from "./tp";

export function copyPermissions(permission: DeepReadonly<Permissions>): Permissions {
    return {
        enabled: [...permission.enabled],
        request: [...permission.request],
        disabled: [...permission.disabled],
    };
}

export function canUse(shapeId: LocalId, target: LOGIC_TYPES, playerId: PlayerId): Access {
    if (
        (target === "door" && !doorSystem.isDoor(shapeId)) ||
        (target === "tp" && !teleportZoneSystem.isTeleportZone(shapeId))
    ) {
        return Access.Disabled;
    }

    const player = playerSystem.getPlayer(playerId);

    if (player === undefined) return Access.Disabled;
    if (player.role === Role.DM) return Access.Enabled;

    const permissions =
        target === "door"
            ? doorSystem.getPermissions(shapeId)
            : (teleportZoneSystem.getPermissions(shapeId) ?? DEFAULT_PERMISSIONS());
    if (permissions === undefined) return Access.Disabled;

    // First specific user permissions
    if (permissions.enabled.includes(player.name)) return Access.Enabled;
    if (permissions.request.includes(player.name)) return Access.Request;
    if (permissions.disabled.includes(player.name)) return Access.Disabled;

    // Check default permissions
    if (permissions.enabled.includes("default")) return Access.Enabled;
    if (permissions.request.includes("default")) return Access.Request;
    if (permissions.disabled.includes("default")) return Access.Disabled;

    return Access.Disabled;
}
