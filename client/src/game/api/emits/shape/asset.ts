import type { ShapeAssetImageSet } from "../../../../apiTypes";
import { wrapSocket } from "../../helpers";

export const sendAssetRectImageChange = wrapSocket<ShapeAssetImageSet>("Shape.Asset.Image.Set");
