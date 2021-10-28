import { Store } from "../core/store";
import type { Note } from "../game/models/general";
import { ClientSettingCategory } from "../game/ui/settings/client/categories";

interface UiState {
    activeNote: Note;

    annotationText: string;

    showClientSettings: boolean;
    clientSettingsTab: string;

    showDmSettings: boolean;

    openedLocationSettings: number;

    showFloorSettings: boolean;
    selectedFloor: number;
}

class UiStore extends Store<UiState> {
    protected data(): UiState {
        return {
            activeNote: { title: "", text: "", uuid: "" },

            annotationText: "",

            showClientSettings: false,
            clientSettingsTab: ClientSettingCategory.Appearance,

            showDmSettings: false,

            openedLocationSettings: -1,

            showFloorSettings: false,
            selectedFloor: 0,
        };
    }

    showClientSettings(show: boolean): void {
        this._state.showClientSettings = show;
    }

    setClientTab(tab: ClientSettingCategory): void {
        this._state.clientSettingsTab = tab;
    }

    showDmSettings(show: boolean): void {
        this._state.showDmSettings = show;
    }

    showLocationSettings(location: number): void {
        this._state.openedLocationSettings = location;
    }

    setActiveNote(note: Note): void {
        this._state.activeNote = note;
    }

    setAnnotationText(text: string): void {
        this._state.annotationText = text;
    }

    showFloorSettings(floorId: number): void {
        this._state.selectedFloor = floorId;
        this._state.showFloorSettings = true;
    }

    hideFloorSettings(): void {
        this._state.showFloorSettings = false;
    }
}

export const uiStore = new UiStore();
(window as any).uiStore = uiStore;
