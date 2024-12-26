import type { LocalId } from "../../../core/id";
import { buildState } from "../../../core/systems/state";

interface MarkerState {
    markers: Set<LocalId>;
}

const state = buildState<MarkerState>({
    markers: new Set(),
});

export const markerState = {
    ...state,
};
