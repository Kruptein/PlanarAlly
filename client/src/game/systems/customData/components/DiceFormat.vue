<script setup lang="ts">
import { computed } from "vue";

import type { ApiShapeCustomDataDiceExpression } from "../../../../apiTypes";
import type { LocalId } from "../../../../core/id";
import { ToolName } from "../../../models/tools";
import { activateTool } from "../../../tools/tools";
import { diceToolInput } from "../../../tools/variants/dice";
import { diceSystem } from "../../dice";
import { diceState } from "../../dice/state";
import { DiceUiState } from "../../dice/types";
import type { ElementId } from "../types";
import { getVariableSegments } from "../utils";

const { element, shapeFocus } = defineProps<{
    element: ApiShapeCustomDataDiceExpression & { id: ElementId };
    shapeFocus?: LocalId;
}>();

const segments = computed(() => {
    return getVariableSegments(element.value, shapeFocus);
});

async function loadRoll(): Promise<void> {
    if (!diceSystem.isLoaded) await diceSystem.loadSystems();
    diceState.mutableReactive.uiState = DiceUiState.Roll;
    activateTool(ToolName.Dice);
    const system = diceSystem.getSystem("2d")!;
    // We need a short timeout when loading the dice tool for the first time
    await new Promise((resolve) => setTimeout(resolve, 100));
    diceToolInput.value = system.parse(
        segments.value
            .filter((segment) => !segment.isVariable || segment.ref.value !== undefined)
            .map((segment) => (segment.isVariable ? segment.ref.value!.value : segment.text))
            .join(" "),
    );
}
</script>

<template>
    <div @click.stop>
        <template v-for="(segment, index) of segments" :key="index">
            <span
                v-if="segment.isVariable"
                class="variable"
                :class="{ unknown: segment.ref.value === undefined }"
                :title="segment.ref.value?.value.toString() ?? 'Unknown'"
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
}

.dice-icon {
    color: rgba(137, 0, 37, 1);
    margin-left: 0.5rem;
}
</style>
