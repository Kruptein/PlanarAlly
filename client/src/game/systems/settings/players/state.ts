import { computed } from "vue";

import { DEFAULT_GRID_SIZE } from "../../../../core/grid";
import { buildState } from "../../../../core/systems/state";
import { InitiativeEffectMode } from "../../../models/initiative";
import { locationSettingsState } from "../location/state";

import { GridModeLabelFormat, type PlayerOptions } from "./models";

interface WithDefault<T> {
    default: T;
    override?: T;
    value: T;
}
const init = <T>(x: T): WithDefault<T> => ({ default: x, override: undefined, value: x });

type PlayerState = { [key in keyof PlayerOptions]: WithDefault<PlayerOptions[key]> };

const state = buildState<PlayerState, "gridSize">({
    gridColour: init("rgba(0, 0, 0, 1)"),
    fowColour: init("rgba(0, 0, 0, 1)"),
    rulerColour: init("rgba(255, 0, 0, 1)"),
    useToolIcons: init(true),
    showTokenDirections: init(true),
    gridModeLabelFormat: init(GridModeLabelFormat.Both),

    invertAlt: init(false),
    disableScrollToZoom: init(false),
    defaultTrackerMode: init(false),
    mousePanMode: init(3),

    useHighDpi: init(true),
    gridSize: init(DEFAULT_GRID_SIZE),
    useAsPhysicalBoard: init(false),
    miniSize: init(1),
    ppi: init(96),

    initiativeCameraLock: init(false),
    initiativeVisionLock: init(false),
    initiativeEffectVisibility: init(InitiativeEffectMode.ActiveAndHover),
    initiativeOpenOnActivate: init(true),

    renderAllFloors: init(true),

    defaultWallColour: init("rgba(147, 51, 234, 1)"),
    defaultWindowColour: init("rgba(79, 157, 228, 0.7)"),
    defaultOpenDoorColour: init("rgba(67, 160, 71, 0.7)"),
    defaultClosedDoorColour: init("rgba(211, 47, 47, 0.7)"),
});

const devicePixelRatio = computed(() => {
    if (state.reactive.useHighDpi.value) {
        return window.devicePixelRatio;
    } else {
        return 1;
    }
});

export const playerSettingsState = {
    ...state,
    devicePixelRatio,
    gridSize: computed(() => {
        if (state.reactive.useAsPhysicalBoard.value) {
            return (
                (state.reactive.ppi.value *
                    state.reactive.miniSize.value *
                    locationSettingsState.reactive.unitSize.value) /
                5 /
                devicePixelRatio.value
            );
        } else {
            return state.reactive.gridSize.value;
        }
    }),
    useSnapping(event: MouseEvent | TouchEvent): boolean {
        return state.raw.invertAlt.value === event.altKey;
    },
};
