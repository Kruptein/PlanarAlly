import type { AssetOptions } from "../../models/asset";
import { socket } from "../socket";

type AssetOptionsRequest<T extends AssetOptions | string> =
    | { success: true; name: string; options: T | null }
    | { success: false; error: string };

export async function requestAssetOptions(assetId: number): Promise<AssetOptionsRequest<AssetOptions>> {
    socket.emit("Asset.Options.Get", assetId);
    return new Promise((resolve: (value: AssetOptionsRequest<AssetOptions>) => void) =>
        socket.once("Asset.Options.Info", (value: AssetOptionsRequest<string>) => {
            if (value.success) {
                if (value.options === null) return resolve({ ...value, options: null });
                return resolve({ ...value, options: JSON.parse(value.options) });
            }
            return resolve(value);
        }),
    );
}

export function sendAssetOptions(asset: number | undefined, options: AssetOptions): void {
    socket.emit("Asset.Options.Set", { asset, options: JSON.stringify(options) });
}
