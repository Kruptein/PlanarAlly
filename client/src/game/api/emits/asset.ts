import type { AssetOptionsInfoFail, AssetOptionsInfoSuccess, AssetOptionsSet } from "../../../apiTypes";
import type { AssetOptions } from "../../models/asset";
import { socket } from "../socket";

type AssetOptionsRequest<T extends AssetOptions | string> =
    | { success: true; name: string; options: T | null }
    | { success: false; error: string };

export async function requestAssetOptions(assetId: number): Promise<AssetOptionsRequest<AssetOptions>> {
    // todo: check if we can use socket reply here
    socket.emit("Asset.Options.Get", assetId);
    return new Promise((resolve: (value: AssetOptionsRequest<AssetOptions>) => void) =>
        socket.once("Asset.Options.Info", (value: AssetOptionsInfoSuccess | AssetOptionsInfoFail) => {
            if (value.success) {
                if (value.options === null) return resolve({ ...value, options: null });
                return resolve({ ...value, options: JSON.parse(value.options) as AssetOptions });
            }
            return resolve(value);
        }),
    );
}

export function sendAssetOptions(asset: number, options: AssetOptions): void {
    const data: AssetOptionsSet = { asset, options: JSON.stringify(options) };
    socket.emit("Asset.Options.Set", data);
}
