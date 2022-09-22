<script setup lang="ts">
import type { DndResult } from "@planarally/dice";
import type { DeepReadonly } from "vue";

import { baseAdjust } from "../../../core/http";
import { diceStore } from "../../dice/state";

function getPosition(position?: readonly [number, number]): { top?: string; left?: string; transform?: string } {
    if (position === undefined) return {};
    const offsets = {
        left: position[0] * ((window.innerWidth / 16) * window.devicePixelRatio),
        top: position[1] * ((window.innerHeight / 16) * window.devicePixelRatio),
    };
    const shelfSize = 3.125;
    if (position[0] === 1) offsets.left -= 6.25 + shelfSize;
    else if (position[0] === 0) offsets.left += shelfSize;
    else if (position[1] === 1) offsets.top -= 6.25 + shelfSize;
    else if (position[1] === 0) offsets.top += shelfSize;

    let deg = 0;
    if (position[0] === 0) {
        deg = 90;
    } else if (position[0] === 1) {
        deg = 270;
    } else if (position[1] === 0) {
        deg = 180;
    }

    return { top: `${offsets.top}rem`, left: `${offsets.left}rem`, transform: `rotate(${deg}deg)` };
}

function getTotalRoll(results: DeepReadonly<DndResult[]>): number {
    let total = 0;
    for (const result of results) {
        total += result.total;
    }
    return total;
}
</script>

<template>
    <div
        class="die-result"
        v-for="[key, { position, results }] of diceStore.state.results.entries()"
        :key="key"
        :style="getPosition(position)"
    >
        <img :src="baseAdjust('/static/img/d20-shelf.svg')" />
        <span>{{ getTotalRoll(results) }}</span>
    </div>
</template>

<style lang="scss" scoped>
.die-result {
    position: absolute;
    width: 6.25rem;
    height: 6.25rem;
    overflow: hidden;
    background-color: white;
    border-radius: 100px;

    > * {
        display: flex;
        width: 6.25rem;
        height: 6.25rem;
        justify-content: center;
        align-items: center;
    }

    span {
        color: white;
        font-weight: bold;
        font-size: 1.25em;
        position: relative;
        top: -6.25rem;
    }
}
</style>
