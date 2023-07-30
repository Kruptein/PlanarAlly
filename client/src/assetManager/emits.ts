import type { ApiAssetInodeMove, ApiAssetRename } from "../apiTypes";

import type { AssetId } from "./models";
import { socket } from "./socket";

function wrapSocket<T>(event: string): (data: T) => void {
    return (data: T): void => {
        socket.emit(event, data);
    };
}

export const sendFolderGet = wrapSocket<AssetId | undefined>("Folder.Get");
export const sendInodeMove = wrapSocket<ApiAssetInodeMove>("Inode.Move");
export const sendAssetRename = wrapSocket<ApiAssetRename>("Asset.Rename");
export const sendAssetRemove = wrapSocket<AssetId>("Asset.Remove");
