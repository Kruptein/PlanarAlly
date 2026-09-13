import type { AssetTemplatesInfoFail, AssetTemplatesInfoRequest, AssetTemplatesInfoSuccess } from "../../../apiTypes";
import { socket } from "../socket";

export async function requestAssetTemplates(
    data: AssetTemplatesInfoRequest,
): Promise<AssetTemplatesInfoSuccess | AssetTemplatesInfoFail> {
    return (await socket.emitWithAck("Asset.Templates.Get", data)) as
        | AssetTemplatesInfoSuccess
        | AssetTemplatesInfoFail;
}
