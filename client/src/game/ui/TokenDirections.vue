<script setup lang="ts">
import { toRef } from "vue";

import { getShape } from "../id";
import type { LocalId } from "../id";
import { setCenterPosition } from "../position";
import { positionState } from "../systems/position/state";

const tokens = toRef(positionState.reactive, "tokenDirections");

function center(token: LocalId): void {
    const shape = getShape(token);
    if (shape === undefined) return;

    setCenterPosition(shape.center);
}
</script>

<template>
    <div id="token-directions">
        <div
            v-for="token of tokens"
            :key="token[0]"
            :style="{
                visibility: token[1] === undefined ? 'hidden' : 'visible',
                left: `${(token[1]?.x ?? 0) - 30}px`,
                top: `${(token[1]?.y ?? 0) - 30}px`,
            }"
            @click="center(token[0])"
        ></div>
    </div>
</template>

<style lang="scss">
#token-directions > div {
    pointer-events: auto;
    position: absolute;
    width: 3.75rem;
    height: 3.75rem;
    border-radius: 1.875rem;
    border: solid 1px transparent;

    &:hover {
        cursor: pointer;
    }
}
</style>
