import { type Raw, computed } from "vue";

import { buildState } from "../../../core/systems/state";
import type { ILayer } from "../../interfaces/layer";
import type { Floor, FloorIndex } from "../../models/floor";

// Layers are kept in a reactive array, but are themselves not reactive!
interface ReactiveFloorState {
    floors: Floor[];
    floorIndex: FloorIndex;

    layers: Raw<ILayer>[];
    layerIndex: number;
}

interface StaticFloorState {
    iteration: number;
}

const state = buildState<ReactiveFloorState, StaticFloorState>(
    {
        floors: [],
        floorIndex: -1 as FloorIndex,
        layers: [],
        layerIndex: -1,
    },
    { iteration: 0 },
);

export const floorState = {
    ...state,
    currentFloor: computed(() => {
        if (state.reactive.floorIndex < 0) return undefined;
        return state.reactive.floors[state.reactive.floorIndex];
    }),

    currentLayer: computed(() => {
        if (state.reactive.layerIndex < 0) return undefined;
        return state.reactive.layers[state.reactive.layerIndex];
    }),
};
