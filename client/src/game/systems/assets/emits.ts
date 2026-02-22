import type { AssetEntryId } from "../../../assets/models";
import { wrapSocket } from "../../api/socket";

export const sendAssetShortcutAdd = wrapSocket<AssetEntryId>("Asset.Shortcut.Add");
export const sendAssetShortcutRemove = wrapSocket<AssetEntryId>("Asset.Shortcut.Remove");
