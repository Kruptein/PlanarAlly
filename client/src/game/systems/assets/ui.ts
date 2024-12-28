import { assetState } from "./state";

export function closeAssetManager(): void {
    if (assetState.raw.managerOpen) {
        assetState.mutableReactive.managerOpen = false;
    }
}

export function toggleAssetManager(): void {
    assetState.mutableReactive.managerOpen = !assetState.raw.managerOpen;
}
