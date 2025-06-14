import type { ShapeTextValueSet } from "../../../../apiTypes";
import { wrapSocket } from "../../socket";

export const sendCircularTokenUpdate = wrapSocket<ShapeTextValueSet>("Shape.CircularToken.Value.Set");
