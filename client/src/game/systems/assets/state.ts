import type { AssetId } from "../../../assets/models";
import { buildState } from "../../../core/systems/state";

interface ReactiveAssetState {
    managerOpen: boolean;
    shortcuts: AssetId[];
}

const state = buildState<ReactiveAssetState>({
    managerOpen: false,
    shortcuts: [],
});

export const assetGameState = {
    ...state,
};
