import type { LocalId } from "../../id";
import { buildState } from "../state";

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
