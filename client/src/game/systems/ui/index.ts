import { registerSystem } from "../../../core/systems";
import type { System } from "../../../core/systems";
import type { ClientSettingCategory } from "../../ui/settings/client/categories";

import { uiState } from "./state";

const { mutableReactive: $ } = uiState;

class UiSystem implements System {
    clear(): void {}

    toggleUi(): void {
        $.showUi = !$.showUi;
    }

    showClientSettings(show: boolean): void {
        $.showClientSettings = show;
    }

    setClientTab(tab: ClientSettingCategory): void {
        $.clientSettingsTab = tab;
    }

    showDmSettings(show: boolean): void {
        $.showDmSettings = show;
    }

    showLocationSettings(location: number): void {
        $.openedLocationSettings = location;
    }

    setAnnotationText(text: string): void {
        $.annotationText = text;
    }

    showFloorSettings(floorId: number): void {
        $.selectedFloor = floorId;
        $.showFloorSettings = true;
    }

    hideFloorSettings(): void {
        $.showFloorSettings = false;
    }

    preventContextMenu(prevent: boolean): void {
        $.preventContextMenu = prevent;
    }
}

export const uiSystem = new UiSystem();
registerSystem("ui", uiSystem, false, uiState);
