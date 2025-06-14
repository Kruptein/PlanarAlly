import type { ShapeTextValueSet } from "../../../../apiTypes";
import { wrapSocket } from "../../socket";

export const sendTextUpdate = wrapSocket<ShapeTextValueSet>("Shape.Text.Value.Set");
