<script setup lang="ts">
import { computed, watch } from "vue";

import { baseAdjust } from "../../../../core/http";
import type { LocalId } from "../../../../core/id";
import { getGlobalId, getShape } from "../../../id";
import type { IAsset } from "../../../interfaces/shapes/asset";
import { customDataSystem } from "../../../systems/customData";
import { customDataState } from "../../../systems/customData/state";
import { DiceUiState } from "../../../systems/dice/types";
import { selectedState } from "../../../systems/selected/state";

const active = defineModel<LocalId | DiceUiState>({ required: true });

watch(
    selectedState.reactive.selected,
    (newSelection) => {
        customDataSystem.loadAndDropState(newSelection, "selected-system");
    },
    { immediate: true },
);

const shapes = computed(() => {
    const sel = selectedState.reactive.selected;
    const images = [];
    for (const id of sel) {
        const hasDiceExpression = customDataState.reactive.data
            .get(id)
            ?.some((data) => data.kind === "dice-expression" && data.shapeId === getGlobalId(id));
        if ((hasDiceExpression ?? false) === false) continue;
        const shape = getShape(id);
        if (shape === undefined) continue;
        if (shape.type === "assetrect") {
            images.push({ id, src: baseAdjust((shape as IAsset).src) });
        }
    }
    return images;
});
</script>

<template>
    <div id="dice-macro-selector">
        <div class="entry" :class="{ active: active === DiceUiState.Roll }" @click="active = DiceUiState.Roll">
            <font-awesome-icon icon="dice-d20" />
        </div>
        <!-- <div class="entry" :class="{ active: active === DiceUiState.Macro }" @click="active = DiceUiState.Macro">
            <font-awesome-icon icon="floppy-disk" />
        </div> -->
        <div
            v-for="{ id, src } in shapes"
            :key="id"
            class="entry"
            :class="{ active: active === id }"
            @click="active = id"
        >
            <img :src="src" width="30px" height="30px" />
        </div>
    </div>
</template>

<style scoped lang="scss">
#dice-macro-selector {
    display: flex;
    flex-direction: column-reverse;
    align-items: flex-end;
    gap: 0.5rem;

    .entry {
        height: 3rem;
        width: 3rem;
        border-radius: 0.5rem;
        background-color: white;
        display: grid;
        place-items: center;
        font-size: 2rem;
        opacity: 0.5;

        &:hover,
        &.active {
            opacity: 1;
            cursor: pointer;
        }
    }
}
</style>
