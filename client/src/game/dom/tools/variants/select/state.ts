import { reactive, readonly } from "vue";

import type { LocalId } from "../../../../core/id";

interface SelectState {
    hoveredDoor?: LocalId;
}

interface ReactiveSelectState {
    hasSelection: boolean;
    showRuler: boolean;

    polygonUiLeft: string;
    polygonUiTop: string;
    polygonUiAngle: string;
    polygonUiVisible: string;
    polygonUiSizeX: string;
    polygonUiSizeY: string;
    polygonUiVertex: boolean;
}

const reactiveState = reactive<ReactiveSelectState>({
    hasSelection: false,
    showRuler: false,

    polygonUiLeft: "0px",
    polygonUiTop: "0px",
    polygonUiAngle: "0deg",
    polygonUiVisible: "hidden",
    polygonUiSizeX: "25px",
    polygonUiSizeY: "25px",
    polygonUiVertex: false,
});

const state: SelectState = {};

export const selectToolState = {
    $: readonly(reactiveState),
    _$: reactiveState,
    _: state,
};
