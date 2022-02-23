import { wrapSocket } from "../../api/helpers";

import type { ServerShapeOwner } from "./models";

export const sendShapeAddOwner = wrapSocket<ServerShapeOwner>("Shape.Owner.Add");
export const sendShapeUpdateOwner = wrapSocket<ServerShapeOwner>("Shape.Owner.Update");
export const sendShapeDeleteOwner =
    wrapSocket<Omit<ServerShapeOwner, "edit_access" | "movement_access" | "vision_access">>("Shape.Owner.Delete");
export const sendShapeUpdateDefaultOwner = wrapSocket<Omit<ServerShapeOwner, "user">>("Shape.Owner.Default.Update");
