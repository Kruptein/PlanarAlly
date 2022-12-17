import { wrapSocket } from "../../helpers";

export const sendAssetRectImageChange = wrapSocket<{ uuid: string; src: string }>("Shape.Asset.Image.Set");
