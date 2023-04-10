import { computed } from "vue";

import type { Floor, LayerName } from "../../core/models/floor";
import { buildState } from "../../core/systems/state";

interface ReactiveFloorState {
    floors: Floor[];
    floorIndex: number;
    layers: { name: LayerName; available: boolean }[];
    layerIndex: number;
}

const state = buildState<ReactiveFloorState>({
    floors: [],
    floorIndex: -1,
    layers: [],
    layerIndex: -1,
});

export const uiFloorState = {
    ...state,
    currentFloor: computed(() => state.reactive.floors.at(state.reactive.floorIndex)),
    currentLayer: computed(() => state.reactive.layers.at(state.reactive.layerIndex)),
};
