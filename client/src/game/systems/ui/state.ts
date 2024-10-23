import type { Component, Raw } from "vue";

import type { LocalId } from "../../id";
import { ClientSettingCategory } from "../../ui/settings/client/categories";
import { buildState } from "../state";

import type { ModTrackerSetting } from "./types";

interface UiState {
    showUi: boolean;

    annotationText: string;

    showClientSettings: boolean;
    clientSettingsTab: string;

    showDmSettings: boolean;

    openedLocationSettings: number;

    showFloorSettings: boolean;
    selectedFloor: number;

    preventContextMenu: boolean;

    // MOD interactions
    characterTabs: { name: string; component: Raw<Component>; filter?: (shape: LocalId) => boolean }[];
    modTrackerSettings: ModTrackerSetting[];
}

const state = buildState<UiState>({
    showUi: true,

    annotationText: "",

    showClientSettings: false,
    clientSettingsTab: ClientSettingCategory.Appearance,

    showDmSettings: false,

    openedLocationSettings: -1,

    showFloorSettings: false,
    selectedFloor: 0,

    preventContextMenu: false,

    characterTabs: [],
    modTrackerSettings: [],
});

export const uiState = {
    ...state,
};
