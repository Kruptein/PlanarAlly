import type { ShapeTextValueSet } from "../../../../apiTypes";
import { wrapSocket } from "../../helpers";

export const sendCircularTokenUpdate = wrapSocket<ShapeTextValueSet>("Shape.CircularToken.Value.Set");
