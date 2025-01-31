import type { LocalId } from "../../../core/id";
import { buildState } from "../../../core/systems/state";

interface ReactiveSelectedState {
    focus: LocalId | undefined;
    selected: Set<LocalId>;
}

const state = buildState<ReactiveSelectedState>({
    focus: undefined,
    selected: new Set(),
});

export const selectedState = {
    ...state,
};
