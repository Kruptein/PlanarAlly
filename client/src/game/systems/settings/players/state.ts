import { computed } from "vue";

import { InitiativeEffectMode } from "../../../models/initiative";
import { DEFAULT_GRID_SIZE } from "../../position/state";
import { buildState } from "../../state";

import type { PlayerOptions } from "./models";

type WithDefault<T> = { default: T; override?: T; value: T };
const init = <T>(x: T): WithDefault<T> => ({ default: x, override: undefined, value: x });

const state = buildState<{ [key in keyof PlayerOptions]: WithDefault<PlayerOptions[key]> }>({
    gridColour: init("rgba(0, 0, 0, 1)"),
    fowColour: init("rgba(0, 0, 0, 1)"),
    rulerColour: init("rgba(255, 0, 0, 1)"),

    invertAlt: init(false),
    disableScrollToZoom: init(false),

    useHighDpi: init(true),
    gridSize: init(DEFAULT_GRID_SIZE),
    useAsPhysicalBoard: init(false),
    miniSize: init(1),
    ppi: init(96),

    initiativeCameraLock: init(false),
    initiativeVisionLock: init(false),
    initiativeEffectVisibility: init(InitiativeEffectMode.ActiveAndHover),
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
            return (state.reactive.ppi.value * state.reactive.miniSize.value) / devicePixelRatio.value;
        } else {
            return state.reactive.gridSize.value;
        }
    }),
    useSnapping(event: MouseEvent | TouchEvent): boolean {
        return state.raw.invertAlt.value === event.altKey;
    },
};