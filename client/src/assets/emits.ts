import type {
    ApiAssetCreateFolder,
    ApiAssetCreateShare,
    ApiAssetFolder,
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

function wrapSocketWithAck<T, Y>(event: string): (data: T) => Promise<Y> {
    return async (data: T): Promise<Y> => {
        return (await socket.emitWithAck(event, data)) as Y;
    };
}

export const getFolder = wrapSocketWithAck<AssetId | undefined, ApiAssetFolder>("Folder.Get");
export const getFolderByPath = wrapSocketWithAck<string, ApiAssetFolder>("Folder.GetByPath");
export const sendInodeMove = wrapSocket<ApiAssetInodeMove>("Inode.Move");
export const sendAssetRename = wrapSocket<ApiAssetRename>("Asset.Rename");
export const sendAssetRemove = wrapSocket<AssetId>("Asset.Remove");
export const sendCreateFolder = wrapSocket<ApiAssetCreateFolder>("Folder.Create");
export const sendRemoveShare = wrapSocket<ApiAssetRemoveShare>("Asset.Share.Remove");
export const sendEditShareRight = wrapSocket<ApiAssetCreateShare>("Asset.Share.Edit");
export const sendCreateShare = wrapSocket<ApiAssetCreateShare>("Asset.Share.Create");
export const getFolderPath = wrapSocketWithAck<AssetId, { id: AssetId; name: string }[]>("Asset.FolderPath");
