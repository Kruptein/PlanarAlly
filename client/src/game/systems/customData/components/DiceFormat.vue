<script setup lang="ts">
import { computed } from "vue";

import type { ApiShapeCustomDataDiceExpression } from "../../../../apiTypes";
import type { LocalId } from "../../../../core/id";
import { prefillDiceTool } from "../../dice/prefill";
import { selectedState } from "../../selected/state";
import type { ElementId } from "../types";
import { getVariableProblem, getVariableSegments } from "../utils";

const { element, shapeFocus } = defineProps<{
    element: ApiShapeCustomDataDiceExpression & { id: ElementId };
    shapeFocus?: LocalId;
}>();

const segments = computed(() => {
    return getVariableSegments(element.value, shapeFocus ?? selectedState.reactive.focus);
});

function loadRoll(): void {
    prefillDiceTool(element.value, shapeFocus ?? selectedState.reactive.focus);
}
</script>

<template>
    <div @click.stop>
        <template v-for="(segment, index) of segments" :key="index">
            <span
                v-if="segment.isVariable"
                class="variable"
                :class="{ unknown: segment.matches.length === 0, ambiguous: segment.matches.length > 1 }"
                :title="getVariableProblem(segment) ?? segment.ref?.value.toString()"
            >
                {{ segment.text }}
            </span>
            <span v-else>{{ segment.text }}</span>
        </template>
        <font-awesome-icon class="dice-icon" icon="fa-solid fa-dice-d20" @click="loadRoll" />
    </div>
</template>

<style scoped lang="scss">
.variable {
    background-color: rgba(255, 168, 191, 0.5);
    padding: 0.25rem 0.5rem;
    margin: 0 0.25rem;
    border-radius: 0.5rem;
    font-weight: bold;

    &.unknown {
        text-decoration: line-through;
    }

    &.ambiguous {
        background-color: rgba(255, 190, 90, 0.6);
        text-decoration: underline wavy rgba(190, 90, 0, 1);
        cursor: help;
    }
}

.dice-icon {
    color: rgba(137, 0, 37, 1);
    margin-left: 0.5rem;
}
</style>
