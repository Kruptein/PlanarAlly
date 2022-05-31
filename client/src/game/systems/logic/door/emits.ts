import { sendSimpleShapeOption } from "../../../api/emits/shape/options";
import type { Permissions } from "../models";

import type { DOOR_TOGGLE_MODE } from "./models";

export const sendShapeIsDoor = sendSimpleShapeOption<boolean>("Shape.Options.IsDoor.Set");
export const sendShapeDoorPermissions = sendSimpleShapeOption<Permissions>("Shape.Options.Door.Permissions.Set");
export const sendShapeDoorToggleMode = sendSimpleShapeOption<DOOR_TOGGLE_MODE>("Shape.Options.Door.ToggleMode.Set");
