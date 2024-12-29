import type { AssetId } from "../../../assets/models";
import { buildState } from "../../../core/systems/state";

interface ReactiveAssetState {
    managerOpen: boolean;
    shortcuts: AssetId[];

    picker: ((value: AssetId | null) => void) | null;
}

const state = buildState<ReactiveAssetState>({
    managerOpen: false,
    shortcuts: [],

    picker: null,
});

export const assetGameState = {
    ...state,
};
