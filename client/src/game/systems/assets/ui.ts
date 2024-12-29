import { assetGameState } from "./state";

export function closeAssetManager(): void {
    if (assetGameState.raw.managerOpen) {
        assetGameState.mutableReactive.managerOpen = false;
    }
}

export function toggleAssetManager(): void {
    assetGameState.mutableReactive.managerOpen = !assetGameState.raw.managerOpen;
}
