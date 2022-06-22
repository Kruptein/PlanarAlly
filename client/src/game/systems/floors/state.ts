import { computed, reactive, readonly } from "vue";

import type { ILayer } from "../../interfaces/layer";
import type { Floor, FloorId } from "../../models/floor";

interface FloorState {
    floors: Floor[];
    floorIndex: FloorId;

    layers: ILayer[];
    layerIndex: number;
}

const state = reactive<FloorState>({
    floors: [],
    floorIndex: -1 as FloorId,
    layers: [],
    layerIndex: -1,
});

export const floorState = {
    $: readonly(state),
    _$: state,

    currentFloor: computed(() => {
        if (state.floorIndex < 0) return undefined;
        return state.floors[state.floorIndex];
    }),

    currentLayer: computed(() => {
        if (state.layerIndex < 0) return undefined;
        return state.layers[state.layerIndex];
    }),
};
