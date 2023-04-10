import type { LocalId } from "../../core/id";
import { buildState } from "../../core/systems/state";

interface ReactiveSelectedState {
    selected: Set<LocalId>;
}

const state = buildState<ReactiveSelectedState>({
    selected: new Set(),
});

export const uiSelectedState = {
    ...state,
};
