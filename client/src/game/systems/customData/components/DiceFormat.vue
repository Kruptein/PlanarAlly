<script setup lang="ts">
import { computed } from "vue";

import type { ApiShapeCustomDataDiceExpression } from "../../../../apiTypes";
import type { LocalId } from "../../../../core/id";
import { ToolName } from "../../../models/tools";
import { activateTool } from "../../../tools/tools";
import { diceSystem } from "../../dice";
import { selectedState } from "../../selected/state";
import type { ElementId } from "../types";
import { getVariableSegments } from "../utils";

const { element, shapeFocus } = defineProps<{
    element: ApiShapeCustomDataDiceExpression & { id: ElementId };
    shapeFocus?: LocalId;
}>();

const segments = computed(() => {
    return getVariableSegments(element.value, shapeFocus ?? selectedState.reactive.focus);
});

async function loadRoll(): Promise<void> {
    if (!diceSystem.isLoaded) await diceSystem.loadSystems();
    activateTool(ToolName.Dice);
    // We need a short timeout when loading the dice tool for the first time
    await new Promise((resolve) => setTimeout(resolve, 100));
    diceSystem.setInput(
        segments.value
            .filter((segment) => !segment.isVariable || segment.ref !== undefined)
            .map((segment) =>
                segment.isVariable
                    ? segment.discriminator !== undefined
                        ? `{[${segment.discriminator}]${segment.ref!.name}}`
                        : segment.ref!.value
                    : segment.text,
            )
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
                :class="{ unknown: segment.ref === undefined }"
                :title="segment.ref?.value.toString() ?? 'Unknown'"
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
