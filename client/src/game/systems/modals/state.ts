import { computed } from "vue";

import { buildState } from "../../../core/systems/state";

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
    // Popped out modals
    poppedModals: Set<ModalIndex>;
}

const state = buildState<ReactiveModalState, ModalState>(
    {
        openModals: new Set(),
        modalOrder: [],
        extraModals: [],
        poppedModals: new Set(),
    },
    {
        fixedModals: [],
    },
);

export const modalState = {
    ...state,
    modals: computed(() => [...state.readonly.fixedModals, ...state.reactive.extraModals] as IndexedModal[]),
};
