import { baseAdjust } from "../core/http";

import type { AssetId } from "./models";
import { assetState } from "./state";

export function showIdName(dir: AssetId): string {
    return assetState.raw.idMap.get(dir)?.name ?? "";
}

export function getImageSrcFromAssetId(
    file: AssetId,
    options?: { addBaseUrl?: boolean; thumbnailFormat?: string },
): string {
    const fileHash = assetState.raw.idMap.get(file)!.fileHash ?? "";
    return getImageSrcFromHash(fileHash, options);
}

export function getImageSrcFromHash(
    fileHash: string,
    options?: { addBaseUrl?: boolean; thumbnailFormat?: string },
): string {
    let path = `/static/assets/${fileHash.slice(0, 2)}/${fileHash.slice(2, 4)}/${fileHash}`;
    if (options?.thumbnailFormat !== undefined) {
        path = `${path}.thumb.${options.thumbnailFormat}`;
    }
    return (options?.addBaseUrl ?? true) ? baseAdjust(path) : path;
}
