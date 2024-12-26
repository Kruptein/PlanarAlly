import { markRaw, type Component } from "vue";

import type { LocalId } from "../../../core/id";
import type { ShapeSettingCategory } from "../../ui/settings/shape/categories";
import type { TrackerId } from "../trackers/models";

import { uiState } from "./state";

export function registerTab(
    component: Component,
    category: string,
    name: string,
    filter: (shape: LocalId) => boolean,
): void {
    uiState.mutableReactive.characterTabs.push({
        category: category as ShapeSettingCategory,
        name,
        component: markRaw(component),
        filter,
    });
}

export function registerTrackerSettings(
    component: Component,
    name: string,
    filter: (shape: LocalId, trackerId: TrackerId) => boolean,
): void {
    uiState.mutableReactive.modTrackerSettings.push({ name, component: markRaw(component), filter });
}
