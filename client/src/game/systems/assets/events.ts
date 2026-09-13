import type { ApiAssetEntry } from "../../../apiTypes";
import { assetState } from "../../../assets/state";
import { socket } from "../../api/socket";

import { assetGameState } from "./state";

socket.on("Asset.Shortcuts.Set", (data: ApiAssetEntry[]) => {
    assetGameState.mutableReactive.shortcuts = data.map((a) => a.id);
    for (const asset of data) {
        assetState.mutableReactive.entryIdMap.set(asset.id, asset);
    }
});
