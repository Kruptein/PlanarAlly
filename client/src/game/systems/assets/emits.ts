import type { AssetId } from "../../../assets/models";
import { wrapSocket } from "../../api/socket";

export const sendAssetShortcutAdd = wrapSocket<AssetId>("Asset.Shortcut.Add");
export const sendAssetShortcutRemove = wrapSocket<AssetId>("Asset.Shortcut.Remove");
