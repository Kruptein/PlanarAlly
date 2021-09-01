import type { AssetFile, AssetList, AssetListMap, ReadonlyAssetListMap } from "../../core/models/types";
import { alphSort } from "../../core/utils";

export function convertAssetListToMap(assets: AssetList): AssetListMap {
    const m = new Map();
    for (const key of Object.keys(assets)) {
        if (key === "__files") {
            m.set(
                key,
                (assets[key] as AssetFile[]).sort((a, b) => alphSort(a.name, b.name)),
            );
        } else {
            const n = convertAssetListToMap(assets[key] as AssetList);
            m.set(key, n);
        }
    }
    return new Map([...m].sort((a, b) => alphSort(a[0], b[0])));
}

export function filterAssetMap(assets: ReadonlyAssetListMap, filter = ""): AssetListMap {
    const m = new Map();
    for (const [key, value] of assets.entries()) {
        if (key === "__files") {
            m.set(
                key,
                (value as AssetFile[])
                    .filter((a) => a.name.toLocaleLowerCase().includes(filter))
                    .sort((a, b) => alphSort(a.name, b.name)),
            );
        } else {
            const n = filterAssetMap(value as ReadonlyAssetListMap, filter);
            if (
                n.size > 1 ||
                (n.size === 1 && (n.get("__files") as AssetFile[]).length > 0) ||
                key.toLocaleLowerCase().includes(filter)
            )
                m.set(key, n);
        }
    }
    return new Map([...m].sort((a, b) => alphSort(a[0], b[0])));
}
