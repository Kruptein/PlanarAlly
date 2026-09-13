import type { AssetEntryId } from "../../../assets/models";
import { buildState } from "../../../core/systems/state";

interface ReactiveAssetState {
    managerOpen: boolean;
    shortcuts: AssetEntryId[];

    picker: ((value: AssetEntryId | null) => void) | null;
}

const state = buildState<ReactiveAssetState>({
    managerOpen: false,
    shortcuts: [],

    picker: null,
});

export const assetGameState = {
    ...state,
};
