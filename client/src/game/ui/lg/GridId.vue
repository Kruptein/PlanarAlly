<script setup lang="ts">
import { toRef } from "vue";

import { coreStore } from "../../../store/core";
import { lastGameboardStore } from "../../../store/lastGameboard";

const show = toRef(lastGameboardStore.state, "showGridId");
</script>

<template>
    <div v-if="show" id="lg-grid-id">
        <div>{{ coreStore.state.boardId }}</div>
    </div>
</template>

<style lang="scss">
#lg-grid-id {
    position: absolute;
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
    align-items: center;

    > div {
        font-size: 200px;
        background-color: white;
    }
}
</style>
