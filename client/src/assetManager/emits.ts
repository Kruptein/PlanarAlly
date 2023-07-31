import type {
    ApiAssetCreateFolder,
    ApiAssetCreateShare,
    ApiAssetInodeMove,
    ApiAssetRemoveShare,
    ApiAssetRename,
} from "../apiTypes";

import type { AssetId } from "./models";
import { socket } from "./socket";

function wrapSocket<T>(event: string): (data: T) => void {
    return (data: T): void => {
        socket.emit(event, data);
    };
}

export const sendFolderGet = wrapSocket<AssetId | undefined>("Folder.Get");
export const sendFolderGetByPath = wrapSocket<string>("Folder.GetByPath");
export const sendInodeMove = wrapSocket<ApiAssetInodeMove>("Inode.Move");
export const sendAssetRename = wrapSocket<ApiAssetRename>("Asset.Rename");
export const sendAssetRemove = wrapSocket<AssetId>("Asset.Remove");
export const sendCreateFolder = wrapSocket<ApiAssetCreateFolder>("Folder.Create");
export const sendRemoveShare = wrapSocket<ApiAssetRemoveShare>("Asset.Share.Remove");
export const sendEditShareRight = wrapSocket<ApiAssetCreateShare>("Asset.Share.Edit");
export const sendCreateShare = wrapSocket<ApiAssetCreateShare>("Asset.Share.Create");
