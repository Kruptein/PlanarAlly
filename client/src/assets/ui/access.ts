import type { DeepReadonly } from "vue";

import type { ApiAsset } from "../../apiTypes";
import { coreStore } from "../../store/core";
import type { AssetId } from "../models";
import { assetState } from "../state";

export function canEdit(data: AssetId | DeepReadonly<ApiAsset> | undefined, includeRootShare = true): boolean {
    if (data === undefined) return false; // We accept undefined to alleviate awkward type checks in callers
    let asset: DeepReadonly<ApiAsset> | undefined;
    if (data instanceof Object && "id" in data) asset = data;
    else asset = assetState.raw.idMap.get(data);

    if (asset === undefined) return false;

    if (assetState.raw.sharedRight === "view") return false;

    if (includeRootShare) {
        const username = coreStore.state.username;
        if (asset === undefined) return false;
        if (asset.owner !== username && !asset.shares.some((s) => s.user === username && s.right === "edit"))
            return false;
    }
    return true;
}
