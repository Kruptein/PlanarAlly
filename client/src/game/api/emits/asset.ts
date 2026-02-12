import type { AssetOptionsInfoFail, AssetOptionsInfoSuccess } from "../../../apiTypes";
import { socket } from "../socket";

export async function requestAssetOptions(assetId: number): Promise<AssetOptionsInfoSuccess | AssetOptionsInfoFail> {
    return (await socket.emitWithAck("Asset.Options.Get", assetId)) as AssetOptionsInfoSuccess | AssetOptionsInfoFail;
}
