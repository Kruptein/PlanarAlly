import { baseAdjust } from "../core/http";

import type { AssetId } from "./models";
import { assetState } from "./state";

export function showIdName(dir: AssetId): string {
    return assetState.raw.idMap.get(dir)?.name ?? "";
}

export function getImageSrcFromAssetId(file: AssetId, addBaseUrl = true): string {
    const fileHash = assetState.raw.idMap.get(file)!.fileHash ?? "";
    return getImageSrcFromHash(fileHash, addBaseUrl);
}

export function getImageSrcFromHash(fileHash: string, addBaseUrl = true): string {
    const path = `/static/assets/${fileHash.slice(0, 2)}/${fileHash.slice(2, 4)}/${fileHash}`;
    return addBaseUrl ? baseAdjust(path) : path;
}
