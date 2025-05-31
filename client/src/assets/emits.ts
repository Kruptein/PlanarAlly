import type {
    ApiAssetCreateFolder,
    ApiAssetCreateShare,
    ApiAssetFolder,
    ApiAssetInodeMove,
    ApiAssetRemoveShare,
    ApiAssetRename,
} from "../apiTypes";
import { generateSocketHelpers } from "../core/socket";

import type { AssetId } from "./models";
import { socket } from "./socket";

const { wrapSocket, wrapSocketWithDataAck } = generateSocketHelpers(socket);

export const getFolder = wrapSocketWithDataAck<AssetId | undefined, ApiAssetFolder>("Folder.Get");
export const getFolderByPath = wrapSocketWithDataAck<string, ApiAssetFolder>("Folder.GetByPath");
export const sendInodeMove = wrapSocket<ApiAssetInodeMove>("Inode.Move");
export const sendAssetRename = wrapSocket<ApiAssetRename>("Asset.Rename");
export const sendAssetRemove = wrapSocket<AssetId>("Asset.Remove");
export const sendCreateFolder = wrapSocket<ApiAssetCreateFolder>("Folder.Create");
export const sendRemoveShare = wrapSocket<ApiAssetRemoveShare>("Asset.Share.Remove");
export const sendEditShareRight = wrapSocket<ApiAssetCreateShare>("Asset.Share.Edit");
export const sendCreateShare = wrapSocket<ApiAssetCreateShare>("Asset.Share.Create");
export const getFolderPath = wrapSocketWithDataAck<AssetId, { id: AssetId; name: string }[]>("Asset.FolderPath");
