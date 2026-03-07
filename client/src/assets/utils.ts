import { baseAdjust } from "../core/http";
import { coreStore } from "../store/core";

import type { AssetEntryId } from "./models";
import { assetState } from "./state";

export function getImageSrcFromAssetId(file: AssetEntryId, options?: { thumbnailFormat?: string }): string {
    const fileHash = assetState.raw.idMap.get(file)!.fileHash ?? "";
    return getImageSrcFromHash(fileHash, options);
}

export function getImageSrcFromHash(fileHash: string, options?: { thumbnailFormat?: string }): string {
    const hashPath = `${fileHash.slice(0, 2)}/${fileHash.slice(2, 4)}/${fileHash}`;
    const assetUrlBase = coreStore.state.assetUrlBase;

    let suffix = hashPath;
    if (options?.thumbnailFormat !== undefined) {
        suffix = `${suffix}.thumb.${options.thumbnailFormat}`;
    }

    if (assetUrlBase !== null) {
        return `${assetUrlBase}/${suffix}`;
    }
    return baseAdjust(`/static/assets/${suffix}`);
}
