import type { LocalId } from "../../id";
import { buildState } from "../state";

interface MarkerState {
    markers: Set<LocalId>;
}

const state = buildState<MarkerState>({
    markers: new Set(),
});

export const markerState = {
    ...state,
};
