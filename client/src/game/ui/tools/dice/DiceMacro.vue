<script setup lang="ts">
import { computed } from "vue";

import type { ApiShapeCustomDataDiceExpression } from "../../../../apiTypes";
import type { LocalId } from "../../../../core/id";
import { useSimplifiedDice } from "../../../../mods/dice";
import type { ElementId } from "../../../systems/customData/types";
import { getDisplayExpression } from "../../../systems/customData/utils";
import { prefillDiceTool } from "../../../systems/dice/prefill";

const { macro, shape } = defineProps<{
    macro: ApiShapeCustomDataDiceExpression & { id: ElementId };
    shape: LocalId;
}>();

const simplified = useSimplifiedDice(
    () => macro.value,
    () => shape,
);

const formula = computed(() => getDisplayExpression(macro.value));

const title = computed(() => {
    if (simplified.value?.kind === "error") return `${formula.value}\n${simplified.value.message}`;
    return formula.value;
});

function loadRoll(): void {
    prefillDiceTool(macro.value, shape);
}
</script>

<template>
    <div class="macro" :title="title" @click="loadRoll">
        <div class="name">{{ macro.name }}</div>
        <div class="value">
            <template v-if="simplified?.kind === 'number'">{{ simplified.value }}</template>
            <template v-else-if="simplified?.kind === 'dice'">{{ simplified.expression }}</template>
            <font-awesome-icon v-else-if="simplified?.kind === 'error'" class="error" icon="circle-exclamation" />
        </div>
        <font-awesome-icon class="dice-icon" icon="dice-d20" />
    </div>
</template>

<style scoped lang="scss">
.macro {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: 0.5rem;

    &:hover {
        background-color: rgba(235, 240, 245, 1);
        cursor: pointer;

        .dice-icon {
            opacity: 1;
        }
    }

    > .name {
        flex: 1 1 auto;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    > .value {
        flex: 0 1 auto;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-weight: bold;

        > .error {
            color: rgba(190, 90, 0, 1);
        }
    }

    > .dice-icon {
        flex: 0 0 auto;
        color: rgba(137, 0, 37, 1);
        opacity: 0.4;
    }
}
</style>
