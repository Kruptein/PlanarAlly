import { markRaw } from "vue";
import type { Component } from "vue";

import { registerSystem } from "../../../core/systems";
import type { System } from "../../../core/systems";
import type { SystemClearReason } from "../../../core/systems/models";

import { modalState } from "./state";
import type { FullModal, IndexedModal, Modal, ModalIndex } from "./types";

const { mutableReactive: $, raw } = modalState;

function isComponent(x: Component | { component: Component }): x is Component {
    return !("component" in x);
}

function fullModal(modal: Modal, modalIndex: ModalIndex): IndexedModal {
    return isComponent(modal)
        ? { component: modal, props: { modalIndex } }
        : { ...modal, props: { ...modal.props, modalIndex } };
}

class ModalSystem implements System {
    clear(reason: SystemClearReason): void {
        if (reason === "leaving") {
            $.extraModals = [];
            $.openModals.clear();
            $.modalOrder = [];
        }
    }

    // These modals are always available, but sometimes hidden
    // extraModals however are modals that are dynamically injected
    setFixedModals(modals: Modal[]): void {
        modalState.mutable.fixedModals = modals.map((modal, i) => fullModal(modal, i as ModalIndex));
        $.modalOrder = modals.map((_, i) => i as ModalIndex);
    }

    focus(index: ModalIndex): void {
        // Interactin with popped modals (i.e. diferent windows)
        // is funky and it doesn't make much sense anyway, so just skip them
        if ($.poppedModals.has(index)) return;

        $.openModals.add(index);
        if (raw.modalOrder.at(-1) === index) return;
        const orderId = raw.modalOrder.findIndex((m) => m === index);
        if (orderId === undefined) {
            console.log("Error in modal focussing");
            return;
        }
        // Doing it like this prevents a double update
        $.modalOrder = [...raw.modalOrder.filter((m) => m !== index), index];
    }

    close(modalId: ModalIndex, remove: boolean): void {
        const extraStartIndex = modalState.readonly.fixedModals.length;
        // Keeping a hole is usually pretty terrible
        // but the logic to handle moving all extra modals 1 index is too complex
        $.openModals.delete(modalId);
        if (remove && modalId >= extraStartIndex) {
            delete $.extraModals[modalId - extraStartIndex];
            $.modalOrder.splice(raw.modalOrder.indexOf(modalId), 1);
        }
    }

    addModal(modal: FullModal): ModalIndex {
        // First see if we can fill up a hole
        let extraIndex = raw.extraModals.findIndex((m) => m === undefined);
        if (extraIndex === -1) {
            extraIndex = raw.extraModals.length;
        }
        const modalIndex = (extraIndex + modalState.readonly.fixedModals.length) as ModalIndex;
        const indexedModal = { ...modal, props: { ...modal.props, modalIndex } };
        ($.extraModals as IndexedModal[])[extraIndex] = markRaw(indexedModal);
        $.modalOrder.push(modalIndex);
        $.openModals.add(modalIndex);
        return modalIndex;
    }
}

export const modalSystem = new ModalSystem();
registerSystem("modals", modalSystem, false, modalState);
