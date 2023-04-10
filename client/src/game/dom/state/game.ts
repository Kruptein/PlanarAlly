import { buildState } from "../../core/systems/state";

interface ReactiveGameState {
    isDm: boolean;
}

const state = buildState<ReactiveGameState>({
    isDm: false,
});

export const uiGameState = {
    ...state,
};
