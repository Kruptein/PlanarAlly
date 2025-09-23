<script setup lang="ts">
import { computed, type ComputedRef } from "vue";

import type { ApiShapeCustomDataDiceExpression } from "../../../../apiTypes";
import { ToolName } from "../../../models/tools";
import { activateTool } from "../../../tools/tools";
import { diceToolInput } from "../../../tools/variants/dice";
import { diceSystem } from "../../dice";
import { customDataState } from "../state";
import type { ElementId, UiShapeCustomData } from "../types";

const { element } = defineProps<{
    element: ApiShapeCustomDataDiceExpression & { id: ElementId };
}>();

const segments = computed(() => {
    const result: (
        | { text: string; isVariable: false }
        | { text: string; isVariable: true; ref: ComputedRef<UiShapeCustomData | undefined> }
    )[] = [];
    for (const part of element.value.split(" ")) {
        const m = part.match(/\[\/([\w/]+)\]/);
        const prev = result?.at(-1);
        if (m === null) {
            if (prev !== undefined && !prev.isVariable) {
                prev.text += ` ${part}`;
            } else {
                result.push({ text: part, isVariable: false });
            }
        } else {
            if (prev !== undefined) prev.text += " ";
            const value = m[1]?.split("/").at(-1);
            if (value === undefined) continue;
            result.push({
                text: `$${value}`,
                isVariable: true,
                ref: computed(() => customDataState.mutableReactive.data.find((data) => data.name === value)),
            });
        }
    }
    return result;
});

async function loadRoll(): Promise<void> {
    if (!diceSystem.isLoaded) await diceSystem.loadSystems();
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
            <span v-if="segment.isVariable" class="variable" :class="{ unknown: segment.ref.value === undefined }">
                {{ segment.text }}
            </span>
            <span v-else>{{ segment.text }}</span>
        </template>
        <font-awesome-icon class="dice-icon" icon="fa-solid fa-dice-d20" @click="loadRoll" />
    </div>
</template>

<style scoped lang="scss">
.variable {
    background-color: rgba(235, 240, 245, 1);
    padding: 0.25rem 0.5rem;
    border-radius: 0.5rem;
    font-weight: bold;

    &.unknown {
        border: solid 2px red;
        text-decoration: line-through;
    }
}

.dice-icon {
    color: rgba(137, 0, 37, 1);
    margin-left: 0.5rem;
}
</style>
