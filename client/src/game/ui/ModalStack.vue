<script setup lang="ts">
/**
 * This component is responsible for management of general modal windows
 * that require no immediate interaction.
 *
 * This component takes care of which modal is on top of which modal as well as
 * closing the top-most modal with the escape-key.
 *
 * Any Modal component that is used here, _should_ expose a close function
 * that can be get/set, as well as emit the following events:
 * - `focus`: when the modal is interacted with
 * - `close`: when the modal is closed
 */
import { computed, onMounted, onUnmounted } from "vue";
import type { Component } from "vue";

import { gameState } from "../systems/game/state";
import { modalSystem } from "../systems/modals";
import { modalState } from "../systems/modals/state";
import type { IndexedModal, ModalIndex } from "../systems/modals/types";

import AssetManager from "./assets/AssetManager.vue";
import DiceResults from "./dice/DiceResults.vue";
import Initiative from "./initiative/Initiative.vue";
import NoteManager from "./notes/NoteManager.vue";
import ClientSettings from "./settings/client/ClientSettings.vue";
import DmSettings from "./settings/dm/DmSettings.vue";
import FloorSettings from "./settings/FloorSettings.vue";
import LocationSettings from "./settings/location/LocationSettings.vue";
import ShapeSettings from "./settings/shape/ShapeSettings.vue";

// Modal Conditions + Listing

const fixedModals = [
    ClientSettings,
    { component: DmSettings, condition: gameState.isDmOrFake },
    { component: FloorSettings, condition: gameState.isDmOrFake },
    Initiative,
    { component: LocationSettings, condition: gameState.isDmOrFake },
    ShapeSettings,
    NoteManager,
    AssetManager,
    DiceResults,
];
modalSystem.setFixedModals(fixedModals);

// Core logic setup

const refs: Record<ModalIndex, { close: () => void }> = {};

onMounted(() => window.addEventListener("keydown", checkEscape));
onUnmounted(() => window.removeEventListener("keydown", checkEscape));

const visibleModals = computed(() => {
    const _modals: Omit<IndexedModal, "condition">[] = [];
    for (const order of modalState.reactive.modalOrder) {
        const modal = modalState.modals.value[order];
        if (modal === undefined) {
            console.error("Error in visible modal handling");
            continue;
        }
        if (modal.condition === undefined || modal.condition.value) {
            _modals.push(modal);
        }
    }
    return _modals;
});

// Type guards

function isReffable(x: Component): x is { close: () => void } {
    return "close" in x;
}

// Event handling

function checkEscape(event: KeyboardEvent): void {
    if (event.key === "Escape") {
        const order = modalState.raw.modalOrder;
        for (let i = order.length - 1; i >= 0; i--) {
            const index = order[i];
            if (index !== undefined && modalState.raw.openModals.has(index)) {
                refs[index]?.close();
                modalState.mutableReactive.openModals.delete(index);
                break;
            }
        }
    }
}

function getComponentName(index: ModalIndex): string {
    const modal = modalState.modals.value[index];
    if (modal === undefined) {
        console.error("Error in getting modal component name");
        return "<Unknown modal>";
    }
    const component = modal.component as { __name: string };
    return component.__name;
}

function setModalRef(m: Component | null, modalId: ModalIndex): void {
    if (m === null) return;
    if (isReffable(m)) refs[modalId] = m;
    else console.warn(`Modal without exposed close function found. (${getComponentName(modalId)})`);
}
</script>

<template>
    <div style="display: contents">
        <component
            :is="modal.component"
            v-for="modal of visibleModals"
            :ref="(m: Component | null) => setModalRef(m, modal.props.modalIndex)"
            :key="modal.props.modalIndex"
            v-bind="modal.props"
            @focus="modalSystem.focus(modal.props.modalIndex)"
            @close="modalSystem.close(modal.props.modalIndex, false)"
            @update:visible="modalSystem.close(modal.props.modalIndex, false)"
        />
    </div>
</template>
