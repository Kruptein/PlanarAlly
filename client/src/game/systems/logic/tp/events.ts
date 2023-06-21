import type {
    ShapeSetBooleanValue,
    ShapeSetPermissionValue,
    ShapeSetTeleportLocationValue,
} from "../../../../apiTypes";
import { UI_SYNC } from "../../../../core/models/types";
import { socket } from "../../../api/socket";
import { getLocalId } from "../../../id";

import { teleportZoneSystem } from ".";

socket.on("Shape.Options.IsTeleportZone.Set", (data: ShapeSetBooleanValue) => {
    const shape = getLocalId(data.shape);
    if (shape === undefined) return;
    teleportZoneSystem.toggle(shape, data.value, UI_SYNC);
});

socket.on("Shape.Options.IsImmediateTeleportZone.Set", (data: ShapeSetBooleanValue) => {
    const shape = getLocalId(data.shape);
    if (shape === undefined) return;
    teleportZoneSystem.toggleImmediate(shape, data.value, UI_SYNC);
});

socket.on("Shape.Options.TeleportZonePermissions.Set", (data: ShapeSetPermissionValue) => {
    const shape = getLocalId(data.shape);
    if (shape === undefined) return;
    teleportZoneSystem.setPermissions(shape, data.value, UI_SYNC);
});

socket.on("Shape.Options.TeleportZoneTarget.Set", (data: ShapeSetTeleportLocationValue) => {
    const shape = getLocalId(data.shape);
    if (shape === undefined) return;
    teleportZoneSystem.setTarget(shape, data.value, UI_SYNC);
});
