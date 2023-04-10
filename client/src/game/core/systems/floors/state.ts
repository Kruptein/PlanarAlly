import type { ILayer } from "../../interfaces/layer";
import type { Floor, FloorIndex } from "../../models/floor";
import { buildState } from "../state";

interface ReactiveFloorState {
    // floors: Floor[];
    // floorIndex: FloorIndex;
    // layers: ILayer[];
}

interface StaticFloorState {
    iteration: number;
    layerIndex: number;
    currentLayer: ILayer | undefined;
    currentFloor: Floor | undefined;
    floors: Floor[];
    floorIndex: FloorIndex;
    layers: ILayer[];
}

const state = buildState<ReactiveFloorState, StaticFloorState>(
    {},
    {
        iteration: 0,
        currentLayer: undefined,
        layerIndex: -1,
        currentFloor: undefined,
        floors: [],
        layers: [],
        floorIndex: -1 as FloorIndex,
    },
);

// watch([() => state.reactive.floors, () => state.reactive.floorIndex], ([floors, index]) => {
//     console.warn("Floors adjusted");
//     state.mutable.currentFloor = floors.at(index);
//     console.log(state.readonly.currentFloor, floors, index);
// });

export const floorState = {
    ...state,
    // currentFloor: computed(() => {
    //     if (state.reactive.floorIndex < 0) return undefined;
    //     return state.reactive.floors[state.reactive.floorIndex];
    // }),
};
