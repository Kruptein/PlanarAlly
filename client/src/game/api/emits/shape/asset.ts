import type { ShapeAssetImageSet } from "../../../../apiTypes";
import { wrapSocket } from "../../socket";

export const sendAssetRectImageChange = wrapSocket<ShapeAssetImageSet>("Shape.Asset.Image.Set");
