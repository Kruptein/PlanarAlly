import type {
    ShapeSetBooleanValue,
    ShapeSetPermissionValue,
    ShapeSetTeleportLocationValue,
} from "../../../../apiTypes";
import { wrapSocket } from "../../../api/helpers";

export const sendShapeIsTeleportZone = wrapSocket<ShapeSetBooleanValue>("Shape.Options.IsTeleportZone.Set");
export const sendShapeIsImmediateTeleportZone = wrapSocket<ShapeSetBooleanValue>(
    "Shape.Options.IsImmediateTeleportZone.Set",
);
export const sendShapeTeleportZonePermissions = wrapSocket<ShapeSetPermissionValue>(
    "Shape.Options.TeleportZonePermissions.Set",
);
export const sendShapeTeleportZoneTarget = wrapSocket<ShapeSetTeleportLocationValue>(
    "Shape.Options.TeleportZoneTarget.Set",
);
