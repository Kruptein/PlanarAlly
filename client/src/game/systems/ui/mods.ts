import { markRaw, type Component } from "vue";

import type { LocalId } from "../../id";

import { uiState } from "./state";

export function registerTab(component: Component, name: string, filter: (shape: LocalId) => boolean): void {
    uiState.mutableReactive.characterTabs.push({ name, component: markRaw(component), filter });
}
