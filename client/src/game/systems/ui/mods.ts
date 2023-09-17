import { markRaw, type Component } from "vue";

import type { LocalId } from "../../id";
import type { TrackerId } from "../trackers/models";

import { uiState } from "./state";

export function registerTab(component: Component, name: string, filter: (shape: LocalId) => boolean): void {
    uiState.mutableReactive.characterTabs.push({ name, component: markRaw(component), filter });
}

export function registerTrackerSettings(
    component: Component,
    name: string,
    filter: (shape: LocalId, trackerId: TrackerId) => boolean,
): void {
    uiState.mutableReactive.modTrackerSettings.push({ name, component: markRaw(component), filter });
}
