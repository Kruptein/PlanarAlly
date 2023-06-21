import type { ApiAura, ApiOptionalAura, AuraMove, ShapeSetAuraValue } from "../../../apiTypes";
import { wrapSocket } from "../../api/helpers";

export const sendShapeMoveAura = wrapSocket<AuraMove>("Shape.Options.Aura.Move");
export const sendShapeRemoveAura = wrapSocket<ShapeSetAuraValue>("Shape.Options.Aura.Remove");
export const sendShapeCreateAura = wrapSocket<ApiAura>("Shape.Options.Aura.Create");
export const sendShapeUpdateAura = wrapSocket<ApiOptionalAura>("Shape.Options.Aura.Update");
