<script setup lang="ts">
import { computed, watch } from "vue";

import { getValue } from "../../../../core/utils";
import { lastGameboardStore } from "../../../../store/lastGameboard";
import { clientSystem } from "../../../systems/client";
import type { ClientId } from "../../../systems/client/models";
import { clientState } from "../../../systems/client/state";

const props = defineProps<{ visible: boolean }>();

// this should happen lazily, hence the use of watch and not watchEffect
watch(
    () => props.visible,
    () => {
        if (props.visible) {
            lastGameboardStore.showGridId(true, true);
        } else {
            lastGameboardStore.showGridId(false, true);
        }
    },
);

const boardInfo = computed(() => {
    const data = [];
    for (const [client, board] of clientState.reactive.clientBoards) {
        const viewport = clientState.reactive.clientViewports.get(client);
        if (viewport !== undefined) data.push({ client, board, viewport });
    }
    return data;
});

function setX(client: ClientId, event: Event): void {
    const value = Number.parseInt(getValue(event));
    clientSystem.setOffset(client, { x: value }, true);
}

function setY(client: ClientId, event: Event): void {
    const value = Number.parseInt(getValue(event));
    clientSystem.setOffset(client, { y: value }, true);
}
</script>

<template>
    <div class="panel" v-show="visible">
        <div>board ID</div>
        <div>X offset</div>
        <div>Y Offset</div>
        <template v-for="{ board, client, viewport } of boardInfo" :key="board">
            <div>{{ board }}</div>
            <input type="number" placeholder="0" :value="viewport.offset_x" @change="setX(client, $event)" />
            <input type="number" placeholder="0" :value="viewport.offset_y" @change="setY(client, $event)" />
        </template>
    </div>
</template>

<style lang="scss" scoped>
.panel {
    display: grid;
    grid-template-columns: 1fr 4.7rem 4.7rem;
    column-gap: 25px;
}
</style>
