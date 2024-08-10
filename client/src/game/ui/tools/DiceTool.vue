<script setup lang="ts">
import { DxConfig, DxSegmentType, type DxSegment } from "@planarally/dice/systems/dx";
import { computed, ref, watch } from "vue";

import type { DiceRollResult } from "../../../apiTypes";
import ClickGroup from "../../../core/components/ClickGroup.vue";
import { arrToToggleGroup } from "../../../core/components/toggleGroup";
import ToggleGroup from "../../../core/components/ToggleGroup.vue";
import { diceSystem } from "../../systems/dice";
import { DxHelper } from "../../systems/dice/dx";
import { diceState } from "../../systems/dice/state";
import { diceTool } from "../../tools/variants/dice";

const showHistory = ref(false);

const _3dOptions = ["yes", "no"] as const;
const use3d = ref<(typeof _3dOptions)[number]>("no");
const shareResultOptions = ["All", "DM", "None"] as const;
const shareResult = ref<(typeof shareResultOptions)[number]>("All");

const literalOptions = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

const input = ref<DxSegment[]>([]);
const lastSeg = computed(() => input.value.at(-1));

watch(use3d, async (value) => {
    if (value === "yes") await diceSystem.load3d();
});

const showOperator = computed(() => {
    const seg = lastSeg.value;
    return seg?.type === DxSegmentType.Die && seg.selector === undefined && seg.selectorValue === undefined;
});

const showSelector = computed(() => {
    const seg = lastSeg.value;
    return (
        seg?.type === DxSegmentType.Die &&
        seg.operator !== undefined &&
        seg.operator !== "min" &&
        seg.operator !== "max" &&
        seg.selectorValue === undefined &&
        seg.selector === undefined
    );
});

const inputText = ref("");
watch(input, (parts) => (inputText.value = DxHelper.stringifySegments(parts)), { deep: true });

function clear(): void {
    input.value = [];
}

function addDie(die: (typeof DxConfig.addOptions)[number]): void {
    DxHelper.addDie(input, die);
}

function addOperator(
    operator: (typeof DxConfig.limitOperatorOptions)[number] | (typeof DxConfig.rerollOperatorOptions)[number],
): void {
    const seg = lastSeg.value;
    if (seg?.type !== DxSegmentType.Die) return;
    seg.operator = operator;
}

function addSelector(selector: (typeof DxConfig.selectorOptions)[number]): void {
    const seg = lastSeg.value;
    if (seg?.type !== DxSegmentType.Die) return;
    seg.selector = selector;
}

function addLiteral(literal: (typeof literalOptions)[number]): void {
    const value = Number.parseInt(literal);
    DxHelper.addLiteral(input, value);
}

function addSymbol(symbol: (typeof DxConfig.symbolOptions)[number]): void {
    input.value.push({ type: DxSegmentType.Operator, input: symbol });
}

function updateFromString(event: Event): void {
    input.value = diceState.raw.systems!["2d"].parse((event.target as HTMLInputElement).value);
}

async function roll(): Promise<void> {
    if (inputText.value.length === 0) return;

    const results = await diceTool.roll(
        inputText.value,
        use3d.value === "yes",
        shareResult.value.toLowerCase() as DiceRollResult["shareWith"],
    );
    clear();
    diceSystem.showResults(results);
}
</script>

<template>
    <div id="dice" class="tool-detail">
        <template v-if="!showHistory">
            <div class="header">\\ SETTINGS \\</div>
            <div id="dice-settings" class="dice-grid">
                <label>Use 3D dice</label>
                <ToggleGroup v-model="use3d" :options="arrToToggleGroup(_3dOptions)" :multi-select="false" />
                <label>Share result with</label>
                <ToggleGroup
                    v-model="shareResult"
                    :options="arrToToggleGroup(shareResultOptions)"
                    :multi-select="false"
                />
            </div>
            <div class="header">
                <span>\\ CONFIGURE \\</span>
                <label id="toggle-advanced" for="advanced-configure-toggle">Toggle Advanced</label>
            </div>
            <div id="configure-settings" class="dice-grid">
                <label>Add</label>
                <ClickGroup :options="DxConfig.addOptions" :disabled="showSelector" @click="addDie" />
                <div id="advanced-config">
                    <label>Operators: limit</label>
                    <ClickGroup
                        :options="DxConfig.limitOperatorOptions"
                        :disabled="!showOperator"
                        @click="addOperator"
                    />
                    <!--<label>Operators: reroll</label>
                        <ClickGroup :options="rerollOperatorOptions" :disabled="!showOperator" @click="addOperator" />-->
                    <label>Selectors</label>
                    <ClickGroup :options="DxConfig.selectorOptions" :disabled="!showSelector" @click="addSelector" />
                </div>
                <input id="advanced-configure-toggle" type="checkbox" />
                <label>Numbers</label>
                <ClickGroup :options="literalOptions" @click="addLiteral" />
                <label>Symbols</label>
                <ClickGroup :options="DxConfig.symbolOptions" :disabled="showSelector" @click="addSymbol" />
            </div>
        </template>
        <template v-else>
            <div class="header">\\ HISTORY \\</div>
            <div id="dice-history">
                <div
                    v-for="[i, { name, roll: historyRoll, player }] of diceState.reactive.history.entries()"
                    :key="i"
                    style="display: contents"
                    @click="diceSystem.showResults(historyRoll)"
                >
                    <div>{{ player }}</div>
                    <div>{{ name }}</div>
                    <div>{{ historyRoll.result }}</div>
                </div>
                <div v-if="diceState.reactive.history.length === 0">No dice rolls have been made so far</div>
            </div>
        </template>
        <div id="buttons">
            <font-awesome-icon
                v-if="showHistory"
                icon="sliders"
                title="Show configuration"
                @click="showHistory = false"
            />
            <font-awesome-icon v-else icon="clock-rotate-left" title="Show history" @click="showHistory = true" />
            <input id="input" type="text" :value="inputText" @change="updateFromString" @keyup.enter="roll" />
            <font-awesome-icon icon="dice-six" title="Roll!" @click="roll" />
        </div>
    </div>
</template>

<style scoped lang="scss">
#advanced-config {
    display: none;

    &:has(~ #advanced-configure-toggle:checked) {
        display: contents;
    }
}

#advanced-configure-toggle {
    display: none;

    + label {
        &:hover {
            cursor: pointer;
            font-weight: bold;
        }
    }
}

#dice {
    display: flex;
    flex-direction: column;

    .header {
        display: flex;
        justify-content: space-between;

        margin: 0;
        padding: 0.5rem 1rem;

        border-radius: 1rem;

        font-weight: bold;
    }

    .dice-grid {
        margin-bottom: 1rem;

        display: grid;
        grid-template-columns: 1fr auto;
        column-gap: 2rem;
        row-gap: 0.5rem;

        align-items: center;

        .toggle-group,
        .click-group {
            justify-self: flex-end;
        }
    }

    #configure-settings {
        row-gap: 0.25rem;

        user-select: none;
    }

    #toggle-advanced {
        font-weight: normal;
        font-style: italic;

        &:hover {
            cursor: pointer;
        }
    }

    #buttons {
        margin-top: 0.5rem;
        display: flex;
        justify-content: space-between;
        align-items: center;

        #input {
            padding: 0.5rem 1rem;
            margin: 0 0.5rem;
        }

        > button {
            margin-left: 0.5rem;
            padding: 0.25rem 0.5rem;
        }

        svg {
            font-size: 1.5em;
        }

        svg:last-of-type {
            font-size: 1.75em;
        }
    }
}

#dice-history {
    display: grid;
    grid-template-columns: auto 1fr auto;

    max-height: 80vh;
    overflow-y: auto;

    row-gap: 0.5rem;
    column-gap: 1rem;

    padding: 0.5rem 1rem;

    overflow-anchor: none;

    div:hover {
        cursor: pointer;
    }
}
</style>
