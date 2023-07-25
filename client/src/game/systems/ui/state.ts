import type { Component, Raw } from "vue";

import type { ApiNote } from "../../../apiTypes";
import type { LocalId } from "../../id";
import { ClientSettingCategory } from "../../ui/settings/client/categories";
import { buildState } from "../state";

interface UiState {
    showUi: boolean;

    activeNote: ApiNote;

    annotationText: string;

    showClientSettings: boolean;
    clientSettingsTab: string;

    showDmSettings: boolean;

    showLgSettings: boolean;

    openedLocationSettings: number;

    showFloorSettings: boolean;
    selectedFloor: number;

    preventContextMenu: boolean;

    characterTabs: { name: string; component: Raw<Component>; filter?: (shape: LocalId) => boolean }[];
}

const state = buildState<UiState>({
    showUi: true,

    activeNote: { title: "", text: "", uuid: "" },

    annotationText: "",

    showClientSettings: false,
    clientSettingsTab: ClientSettingCategory.Appearance,

    showDmSettings: false,

    showLgSettings: false,

    openedLocationSettings: -1,

    showFloorSettings: false,
    selectedFloor: 0,

    preventContextMenu: false,

    characterTabs: [],
});

export const uiState = {
    ...state,
};
