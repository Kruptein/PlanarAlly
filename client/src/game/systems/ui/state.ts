import type { Component, Raw } from "vue";

import type { LocalId } from "../../../core/id";
import { buildState } from "../../../core/systems/state";
import { ClientSettingCategory } from "../../ui/settings/client/categories";
import type { ShapeSettingCategory } from "../../ui/settings/shape/categories";

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
    characterTabs: {
        category: ShapeSettingCategory;
        name: string;
        component: Raw<Component>;
        filter?: (shape: LocalId) => boolean;
    }[];
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
