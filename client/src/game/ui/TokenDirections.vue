<script setup lang="ts">
import { computed } from "vue";

import type { LocalId } from "../../core/id";
import { filter } from "../../core/iter";
import { getShape } from "../id";
import { setCenterPosition } from "../position";
import { accessState } from "../systems/access/state";
import { positionState } from "../systems/position/state";

const tokens = computed(() =>
    filter(positionState.reactive.tokenDirections.entries(), ([id]) => accessState.activeTokens.value.has(id)),
);

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
#token-directions {
    position: relative;

    > div {
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
}
</style>
