import { sendSimpleShapeOption } from "../../../api/emits/shape/options";
import type { Permissions } from "../models";

export const sendShapeIsDoor = sendSimpleShapeOption<boolean>("Shape.Options.IsDoor.Set");
export const sendShapeDoorPermissions = sendSimpleShapeOption<Permissions>("Shape.Options.DoorPermissions.Set");
