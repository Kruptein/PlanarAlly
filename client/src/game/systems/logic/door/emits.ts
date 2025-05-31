import type { DeepReadonly } from "vue";

import type { ShapeSetBooleanValue, ShapeSetDoorToggleModeValue, ShapeSetPermissionValue } from "../../../../apiTypes";
import { wrapSocket } from "../../../api/socket";

export const sendShapeIsDoor = wrapSocket<ShapeSetBooleanValue>("Shape.Options.IsDoor.Set");
export const sendShapeDoorPermissions = wrapSocket<DeepReadonly<ShapeSetPermissionValue>>(
    "Shape.Options.Door.Permissions.Set",
);
export const sendShapeDoorToggleMode = wrapSocket<ShapeSetDoorToggleModeValue>("Shape.Options.Door.ToggleMode.Set");
