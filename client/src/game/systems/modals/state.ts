import { computed } from "vue";

import { buildState } from "../state";

import type { IndexedModal, ModalIndex } from "./types";

interface ModalState {
    fixedModals: IndexedModal[];
}

interface ReactiveModalState {
    // This is purely kept for Escape handling
    openModals: Set<ModalIndex>;
    // The order from bottom to top of the modals
    modalOrder: ModalIndex[];
    // Dynamically injected modals
    extraModals: IndexedModal[];
}

const state = buildState<ReactiveModalState, ModalState>(
    {
        openModals: new Set(),
        modalOrder: [],
        extraModals: [],
    },
    {
        fixedModals: [],
    },
);

export const modalState = {
    ...state,
    modals: computed(() => [...state.readonly.fixedModals, ...state.reactive.extraModals] as IndexedModal[]),
};
