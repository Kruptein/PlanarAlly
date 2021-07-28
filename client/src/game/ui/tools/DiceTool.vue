<script setup lang="ts">
import type { CSSProperties } from "vue";
import { computed, nextTick, onMounted, ref } from "vue";

import { diceTool } from "../../tools/variants/dice";

import { useToolPosition } from "./toolPosition";

// Common tool bootup logic

const right = ref("0px");
const arrow = ref("0px");
const button = ref<HTMLButtonElement | null>(null);
const historyDiv = ref<HTMLDivElement | null>(null);

const toolStyle = computed(() => ({ "--detailRight": right.value, "--detailArrow": arrow.value } as CSSProperties));

onMounted(() => {
    ({ right: right.value, arrow: arrow.value } = useToolPosition(diceTool.toolName));
});

// Dice logic
const diceArray = ref<{ die: number; amount: number }[]>([]);
const history = ref<{ roll: string; result: number }[]>([]);
let timeout: number | undefined;

function addToHistory(roll: string, result: number): void {
    history.value.push({ roll, result });
    nextTick(() => {
        historyDiv.value!.scrollTop = historyDiv.value!.scrollHeight;
    });
}

function add(die: number): void {
    button.value?.classList.remove("transition");
    button.value!.clientWidth; // force reflow
    button.value?.classList.add("transition");
    const d = diceArray.value.find((d) => d.die === die);
    if (d === undefined) {
        diceArray.value.push({ die, amount: 1 });
    } else {
        d.amount++;
    }
    clearTimeout(timeout);
    timeout = setTimeout(go, 1000);
}

const diceText = computed(() => {
    let text = "";
    for (const [i, d] of diceArray.value.entries()) {
        text += `${d.amount}d${d.die}`;
        if (i < diceArray.value.length - 1) {
            text += " + ";
        }
    }
    return text;
});

async function reroll(inp: string): Promise<void> {
    const result = await diceTool.roll(inp);
    addToHistory(inp, result);
}

async function go(): Promise<void> {
    clearTimeout(timeout);
    button.value?.classList.remove("transition");
    const rollString = diceText.value;
    const result = await diceTool.roll(rollString);
    addToHistory(rollString, result);
    diceArray.value = [];
}
</script>

<template>
    <div id="dice" class="tool-detail" :style="toolStyle">
        <div id="dice-history" ref="historyDiv">
            <template v-for="r of history" :key="r.roll">
                <div class="roll" @click="reroll(r.roll)">{{ r.roll }}</div>
                <div class="result">{{ r.result }}</div>
            </template>
        </div>
        <div id="dice-picker">
            <div @click="add(20)">20</div>
            <div @click="add(12)">12</div>
            <div @click="add(10)">10</div>
            <div @click="add(8)">8</div>
            <div @click="add(6)">6</div>
            <div @click="add(4)">4</div>
        </div>
        <div id="dice-input">
            <div>{{ diceText }}</div>
            <button ref="button" @click="go">GO</button>
        </div>
    </div>
</template>

<style scoped lang="scss">
#dice {
    display: flex;
    flex-direction: column;
    min-width: 10em;

    #dice-history {
        display: grid;
        grid-template-columns: 1fr 2em;

        max-height: 10em;
        overflow-y: auto;
        padding-right: 0.5em;

        > .roll:hover {
            cursor: pointer;
        }

        > .result {
            text-align: right;
        }
    }

    #dice-picker {
        display: flex;
        flex-direction: row;
        justify-content: space-around;

        padding: 0.5em 0;
        margin: 0.5em 0;

        border-top: solid 1px;
        border-bottom: solid 1px;

        > div:hover {
            cursor: pointer;
            font-weight: bold;
        }
    }

    #dice-input {
        display: flex;
        flex-direction: row;

        > div {
            flex-grow: 2;
        }

        > button {
            $border: #7c253e;
            margin-left: 15px;
            padding: 0.3em 0.6em;
            border: 0;
            background: none;
            box-shadow: inset 0 0 0 2px transparent;

            position: relative;
            vertical-align: middle;

            transition: color 0.25s;

            &::before,
            &::after {
                box-sizing: inherit;
                content: "";
                position: absolute;
                width: 100%;
                height: 100%;
            }

            &::before,
            &::after {
                // Set border to invisible, so we don't see a 4px border on a 0x0 element before the transition starts
                border: 2px solid transparent;
                width: 0;
                height: 0;
            }

            // This covers the top & right borders (expands right, then down)
            &::before {
                top: 0;
                left: 0;
            }

            // And this the bottom & left borders (expands left, then up)
            &::after {
                bottom: 0;
                right: 0;
            }

            // Hover styles
            &:hover {
                cursor: pointer;
            }

            &.transition::before,
            &.transition::after {
                width: 100%;
                height: 100%;
            }

            &.transition::before {
                border-top-color: $border; // Make borders visible
                border-right-color: $border;
                transition: width 0.25s ease-out,
                    // Width expands first
                    height 0.25s ease-out 0.25s; // And then height
            }

            &.transition::after {
                border-bottom-color: $border; // Make borders visible
                border-left-color: $border;
                transition: border-color 0s ease-out 0.5s,
                    // Wait for ::before to finish before showing border
                    width 0.25s ease-out 0.5s,
                    // And then exanding width
                    height 0.25s ease-out 0.75s; // And finally height
            }
        }
    }
}
</style>
