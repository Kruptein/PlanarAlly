import type { ShapeTextValueSet } from "../../../../apiTypes";
import { wrapSocket } from "../../helpers";

export const sendTextUpdate = wrapSocket<ShapeTextValueSet>("Shape.Text.Value.Set");
