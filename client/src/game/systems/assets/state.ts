import { buildState } from "../../../core/systems/state";

interface ReactiveAssetState {
    // manager UI
    managerOpen: boolean;
}

const state = buildState<ReactiveAssetState>({
    managerOpen: false,
});

export const assetState = {
    ...state,
};
