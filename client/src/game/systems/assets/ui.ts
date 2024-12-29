import type { AssetId } from "../../../assets/models";

import { assetGameState } from "./state";

function openAssetManager(): void {
    assetGameState.mutableReactive.managerOpen = true;
}

export function closeAssetManager(): void {
    if (assetGameState.raw.managerOpen) {
        assetGameState.mutableReactive.managerOpen = false;
        if (assetGameState.raw.picker !== null) {
            assetGameState.raw.picker(null);
        }
    }
}

export function toggleAssetManager(): void {
    if (assetGameState.raw.managerOpen) {
        closeAssetManager();
    } else {
        openAssetManager();
    }
}

export async function pickAsset(): Promise<AssetId | null> {
    openAssetManager();
    return new Promise((resolve) => {
        assetGameState.mutableReactive.picker = resolve;
    });
}
