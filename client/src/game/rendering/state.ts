import { computed } from "vue";

import { buildState } from "../../core/systems/state";
import { playerSettingsState } from "../systems/settings/players/state";

interface RenderingState {
    gestureScale: number | null;
}

const state = buildState<RenderingState>({
    gestureScale: null,
});

export const renderingState = {
    ...state,
    pixelRatio: computed(() => playerSettingsState.devicePixelRatio.value * (state.reactive.gestureScale ?? 1)),
};
