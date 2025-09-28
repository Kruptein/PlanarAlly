<script setup lang="ts">
import { computed } from "vue";

import type { LocalId } from "../../../../core/id";
import { activeShapeStore } from "../../../../store/activeShape";
import DiceFormat from "../../../systems/customData/components/DiceFormat.vue";
import { customDataState } from "../../../systems/customData/state";
import { DiceUiState } from "../../../systems/dice/types";
import { selectedSystem } from "../../../systems/selected";
import { uiState } from "../../../systems/ui/state";
import { ShapeSettingCategory } from "../../settings/shape/categories";

const { active } = defineProps<{
    active: LocalId | DiceUiState;
}>();

function isShape(active: LocalId | DiceUiState): active is LocalId {
    return ![DiceUiState.Roll, DiceUiState.Macro].includes(active);
}

const macros = computed(() => {
    if (!isShape(active)) return [];
    return customDataState.reactive.data.get(active)?.filter((data) => data.kind === "dice-expression") ?? [];
});

function openSettings(): void {
    if (!isShape(active)) return;
    selectedSystem.focus(active);
    uiState.mutableReactive.activeShapeTab = ShapeSettingCategory.CustomData;
    activeShapeStore.setShowEditDialog(true);
}
</script>

<template>
    <div id="dice-macros" class="container">
        <h1>
            Dice Macros
            <font-awesome-icon icon="cog" @click="openSettings" />
        </h1>
        <div v-for="macro in macros" :key="macro.id" class="macro">
            <div class="macro-prefix">{{ macro.prefix.slice(1) }}</div>
            <div>
                <b>{{ macro.name }}</b>
                <DiceFormat :element="macro" :shape-focus="isShape(active) ? active : undefined" />
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
#dice-macros {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;

    h1 {
        align-self: center;
        display: flex;
        align-items: center;
        gap: 0.5rem;

        svg {
            font-size: 0.9rem;
        }
    }

    .macro {
        display: flex;
        flex-direction: column;

        > .macro-prefix {
            max-width: 50%;
            overflow: hidden;
            font-style: italic;
            text-overflow: ellipsis;
            white-space: nowrap;
            direction: rtl;
            text-align: left;
        }

        > div:last-child {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
    }
}
</style>
