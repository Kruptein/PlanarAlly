import { markRaw } from "vue";
import type { MaybeRef } from "vue";

import type { Section } from "../../../core/components/contextMenu/types";
import type { LocalId } from "../../../core/id";

import { uiState } from "./state";
import type { PanelTab } from "./types";

export function registerContextMenuEntry(entry: MaybeRef<(shape: LocalId) => Section[]>): () => void {
    uiState.mutableReactive.shapeContextMenuEntries.push(entry);
    return () => {
        const entries = uiState.mutableReactive.shapeContextMenuEntries;
        const index = entries.indexOf(entry);
        if (index !== -1) entries.splice(index, 1);
    };
}

export function registerTab(
    tab: PanelTab,
    filter?: MaybeRef<(shape: LocalId, hasEditAccess: boolean) => boolean>,
): () => void {
    const entry = markRaw({ tab, filter });
    uiState.mutableReactive.characterTabs.push(entry);
    return () => {
        const tabs = uiState.mutableReactive.characterTabs;
        const index = tabs.indexOf(entry);
        if (index !== -1) tabs.splice(index, 1);
    };
}
