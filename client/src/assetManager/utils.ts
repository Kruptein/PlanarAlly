import { baseAdjust } from "../core/http";

import type { AssetId } from "./models";
import { assetState } from "./state";

export function showIdName(dir: AssetId): string {
    return assetState.raw.idMap.get(dir)?.name ?? "";
}

export function getIdImageSrc(file: AssetId): string {
    return baseAdjust("/static/assets/" + (assetState.raw.idMap.get(file)!.fileHash ?? ""));
}
