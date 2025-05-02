import { markRaw } from "vue";
import type { MaybeRef } from "vue";

import type { Section } from "../../../core/components/contextMenu/types";
import type { LocalId } from "../../../core/id";

import { uiState } from "./state";
import type { PanelTab } from "./types";

export function registerContextMenuEntry(entry: MaybeRef<(shape: LocalId) => Section[]>): void {
    uiState.mutableReactive.shapeContextMenuEntries.push(entry);
}

export function registerTab(tab: PanelTab, filter: MaybeRef<(shape: LocalId) => boolean>): void {
    uiState.mutableReactive.characterTabs.push(markRaw({ tab, filter }));
}
