import { ServerShapeOwner } from "../../models/shapes";
import { wrapSocket } from "../helpers";

export const sendShapeAddOwner = wrapSocket<ServerShapeOwner>("Shape.Owner.Add");
export const sendShapeUpdateOwner = wrapSocket<ServerShapeOwner>("Shape.Owner.Update");
export const sendShapeDeleteOwner = wrapSocket<ServerShapeOwner>("Shape.Owner.Delete");
export const sendShapeUpdateDefaultOwner = wrapSocket<Omit<ServerShapeOwner, "user">>("Shape.Owner.Default.Update");
