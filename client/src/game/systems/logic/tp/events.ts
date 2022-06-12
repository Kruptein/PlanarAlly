import { UI_SYNC } from "../../../../core/models/types";
import { socket } from "../../../api/socket";
import { getLocalId } from "../../../id";
import type { GlobalId } from "../../../id";
import type { Permissions } from "../models";

import type { TeleportOptions } from "./models";

import { teleportZoneSystem } from ".";

socket.on("Shape.Options.IsTeleportZone.Set", (data: { shape: GlobalId; value: boolean }) => {
    const shape = getLocalId(data.shape);
    if (shape === undefined) return;
    teleportZoneSystem.toggle(shape, data.value, UI_SYNC);
});

socket.on("Shape.Options.IsImmediateTeleportZone.Set", (data: { shape: GlobalId; value: boolean }) => {
    const shape = getLocalId(data.shape);
    if (shape === undefined) return;
    teleportZoneSystem.toggleImmediate(shape, data.value, UI_SYNC);
});

socket.on("Shape.Options.TeleportZonePermissions.Set", (data: { shape: GlobalId; value: Permissions }) => {
    const shape = getLocalId(data.shape);
    if (shape === undefined) return;
    teleportZoneSystem.setPermissions(shape, data.value, UI_SYNC);
});

socket.on("Shape.Options.TeleportZoneTarget.Set", (data: { shape: GlobalId; value: TeleportOptions["location"] }) => {
    const shape = getLocalId(data.shape);
    if (shape === undefined) return;
    teleportZoneSystem.setTarget(shape, data.value, UI_SYNC);
});
