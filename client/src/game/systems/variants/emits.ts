import type { ApiAddVariant, ApiCreateVariant, ApiVariantIdentifier } from "../../../apiTypes";
import { wrapSocket } from "../../api/socket";

export const sendShapeAddVariant = wrapSocket<ApiCreateVariant>("Shape.Variants.Create");
export const sendShapeUpdateVariant = wrapSocket<ApiAddVariant>("Shape.Variants.Update");
export const sendShapeRemoveVariant = wrapSocket<ApiVariantIdentifier>("Shape.Variants.Remove");
