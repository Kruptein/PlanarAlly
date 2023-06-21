import type { ApiDefaultShapeOwner, ApiDeleteShapeOwner, ApiShapeOwner } from "../../../apiTypes";
import { wrapSocket } from "../../api/helpers";

export const sendShapeAddOwner = wrapSocket<ApiShapeOwner>("Shape.Owner.Add");
export const sendShapeUpdateOwner = wrapSocket<ApiShapeOwner>("Shape.Owner.Update");
export const sendShapeDeleteOwner = wrapSocket<ApiDeleteShapeOwner>("Shape.Owner.Delete");
export const sendShapeUpdateDefaultOwner = wrapSocket<ApiDefaultShapeOwner>("Shape.Owner.Default.Update");
