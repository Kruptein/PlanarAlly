import { sendSimpleShapeOption } from "../../../api/emits/shape/options";
import type { Permissions } from "../models";

import type { TeleportOptions } from "./models";

export const sendShapeIsTeleportZone = sendSimpleShapeOption<boolean>("Shape.Options.IsTeleportZone.Set");
export const sendShapeIsImmediateTeleportZone = sendSimpleShapeOption<boolean>(
    "Shape.Options.IsImmediateTeleportZone.Set",
);
export const sendShapeTeleportZonePermissions = sendSimpleShapeOption<Permissions>(
    "Shape.Options.TeleportZonePermissions.Set",
);
export const sendShapeTeleportZoneTarget = sendSimpleShapeOption<TeleportOptions["location"]>(
    "Shape.Options.TeleportZoneTarget.Set",
);
