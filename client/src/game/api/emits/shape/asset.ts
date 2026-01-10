import type { ShapeAssetImageSet, ShapeTemplateAdd } from "../../../../apiTypes";
import { wrapSocket } from "../../socket";

export const sendAssetRectImageChange = wrapSocket<ShapeAssetImageSet>("Shape.Asset.Image.Set");
export const sendShapeTemplateAdd = wrapSocket<ShapeTemplateAdd>("Shape.Template.Add");
