import type { ApiAsset } from "../../../apiTypes";
import { assetState } from "../../../assets/state";
import { socket } from "../../api/socket";

import { assetGameState } from "./state";

socket.on("Asset.Shortcuts.Set", (data: ApiAsset[]) => {
    assetGameState.mutableReactive.shortcuts = data.map((a) => a.id);
    for (const asset of data) {
        assetState.mutableReactive.idMap.set(asset.id, asset);
    }
});
