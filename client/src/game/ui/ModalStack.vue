<script setup lang="ts">
import { computed, ref } from "vue";
import type { Component, ComputedRef } from "vue";

import { getGameState } from "../../store/_game";
import { coreStore } from "../../store/core";
import { clientState } from "../systems/client/state";

import DiceResults from "./dice/DiceResults.vue";
import Initiative from "./initiative/Initiative.vue";
import LgGridId from "./lg/GridId.vue";
import SelectionInfo from "./SelectionInfo.vue";
import ClientSettings from "./settings/client/ClientSettings.vue";
import DmSettings from "./settings/dm/DmSettings.vue";
import FloorSettings from "./settings/FloorSettings.vue";
import LgSettings from "./settings/lg/LgSettings.vue";
import LocationSettings from "./settings/location/LocationSettings.vue";
import ShapeSettings from "./settings/shape/ShapeSettings.vue";
import CreateTokenDialog from "./tokendialog/CreateTokenDialog.vue";

const hasGameboard = coreStore.state.boardId !== undefined;
const hasGameboardClients = computed(() => clientState.reactive.clientBoards.size > 0);

const dmOrFake = computed(() => {
    const state = getGameState();
    return state.isDm || state.isFakePlayer;
});

const modals: (Component | { component: Component; condition: ComputedRef<boolean> })[] = [
    ClientSettings,
    CreateTokenDialog,
    DiceResults,
    { component: DmSettings, condition: dmOrFake },
    { component: FloorSettings, condition: dmOrFake },
    Initiative,
    { component: LgSettings, condition: computed(() => hasGameboardClients.value && dmOrFake.value) },
    { component: LocationSettings, condition: dmOrFake },
    SelectionInfo,
    ShapeSettings,
];
if (hasGameboard) {
    modals.push(LgGridId, DiceResults);
}
const modalOrder = ref(Array.from({ length: modals.length }, (_, i) => i));

function focus(index: number): void {
    modalOrder.value.push(modalOrder.value.splice(index, 1)[0]);
}

function isComponent(x: Component | { component: Component }): x is Component {
    return !("component" in x);
}

const visibleModals = computed(() => {
    const _modals: { index: number; component: Component }[] = [];
    for (let i = 0; i < modalOrder.value.length; i++) {
        const modal = modals[modalOrder.value[i]];
        if (isComponent(modal)) {
            _modals.push({ index: i, component: modal });
        } else if (modal.condition.value) {
            _modals.push({ index: i, component: modal.component });
        }
    }
    return _modals;
});
</script>

<template>
    <component
        v-for="modal of visibleModals"
        :is="modal.component"
        :key="modal.component"
        @focus="focus(modal.index)"
    />
</template>
