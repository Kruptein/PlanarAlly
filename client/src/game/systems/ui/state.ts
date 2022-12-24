import { ClientSettingCategory } from "../../ui/settings/client/categories";
import type { Note } from "../notes/models";
import { buildState } from "../state";

interface UiState {
    showUi: boolean;

    activeNote: Note;

    annotationText: string;

    showClientSettings: boolean;
    clientSettingsTab: string;

    showDmSettings: boolean;

    showLgSettings: boolean;

    openedLocationSettings: number;

    showFloorSettings: boolean;
    selectedFloor: number;

    preventContextMenu: boolean;
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
});

export const uiState = {
    ...state,
};
