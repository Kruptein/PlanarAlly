<script setup lang="ts">
import { debugState } from "./debug";

// const socketAvg = computed(
//     () => debugState.socketLatencies.reduce((a, b) => a + b, 0) / debugState.socketLatencies.length,
// );
// const renderAvg = computed(
//     () => debugState.renderLatencies.reduce((a, b) => a + b, 0) / debugState.renderLatencies.length,
// );
</script>

<template>
    <div id="debug">
        <div>DEBUG INFO</div>
        <!-- <div>Socket: {{ debugState.socketLatencies.at(-1)!.toFixed(2) }} ({{ socketAvg.toFixed(2) }})</div> -->
        <!-- <div>Render: {{ debugState.renderLatencies.at(-1)!.toFixed(2) }} ({{ renderAvg.toFixed(2) }})</div> -->
        <div>Render: {{ debugState.render }}</div>
        <!-- <div v-for="layer of Object.entries(debugState.layerLatencies)" :key="layer[0]">
            {{ layer[0] }}: {{ layer[1].toFixed(2) }}
        </div> -->
    </div>
</template>

<style lang="scss" scoped>
#debug {
    color: white;
    background-color: rgba(0, 0, 0, 0.5);
    padding: 25px;
    position: fixed;
    top: 25px;
    right: 16rem;
    width: 16rem;

    display: flex;
    flex-direction: column;
    justify-content: center;
}
</style>
