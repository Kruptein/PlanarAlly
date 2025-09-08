import type { MaybeRef, Raw } from "vue";

import type { Section } from "../../../core/components/contextMenu/types";
import type { LocalId } from "../../../core/id";
import { buildState } from "../../../core/systems/state";
import type { FloorId } from "../../models/floor";
import { ClientSettingCategory } from "../../ui/settings/client/categories";

import type { PanelTab } from "./types";

interface UiState {
    showUi: boolean;

    annotationText: string;

    showClientSettings: boolean;
    clientSettingsTab: string;

    showDmSettings: boolean;

    openedLocationSettings: number;

    showFloorSettings: boolean;
    selectedFloor: FloorId;

    preventContextMenu: boolean;

    // MOD interactions
    characterTabs: Raw<{
        tab: PanelTab;
        filter?: MaybeRef<(shape: LocalId, hasEditAccess: boolean) => boolean>;
    }>[];
    shapeContextMenuEntries: Raw<MaybeRef<(shape: LocalId) => Section[]>>[];
}

const state = buildState<UiState>({
    showUi: true,

    annotationText: "",

    showClientSettings: false,
    clientSettingsTab: ClientSettingCategory.Appearance,

    showDmSettings: false,

    openedLocationSettings: -1,

    showFloorSettings: false,
    selectedFloor: 0 as FloorId,

    preventContextMenu: false,

    // MODS
    characterTabs: [],
    shapeContextMenuEntries: [],
});

export const uiState = {
    ...state,
};
