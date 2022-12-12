<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";

import { coreStore } from "../../../store/core";
import { sendDiceRollResult } from "../../api/emits/dice";
import { diceStore } from "../../dice/state";
import { diceTool } from "../../tools/variants/dice";

const button = ref<HTMLButtonElement | null>(null);
const historyDiv = ref<HTMLDivElement | null>(null);

// Dice logic
const diceArray = ref<{ die: number; amount: number }[]>([]);
let timeout: number | undefined;

watch(diceTool.state.history, () => {
    nextTick(() => {
        historyDiv.value!.scrollTop = historyDiv.value!.scrollHeight;
    });
});

function add(die: number): void {
    if (diceTool.state.autoRoll) {
        button.value?.classList.remove("transition");
        button.value!.clientWidth; // force reflow
        button.value?.classList.add("transition");

        clearTimeout(timeout);
        timeout = window.setTimeout(go, 1000);
    }
    const d = diceArray.value.find((d) => d.die === die);
    if (d === undefined) {
        diceArray.value.push({ die, amount: 1 });
    } else {
        d.amount++;
    }
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

async function reroll(roll: string): Promise<void> {
    const key = await diceTool.roll(roll);
    const result = diceStore.getTotal(key);
    diceTool.state.history.push({ roll, result, player: coreStore.state.username });
    sendDiceRollResult({
        player: coreStore.state.username,
        roll,
        result,
        shareWithAll: diceTool.state.shareWithAll,
    });
}

async function go(): Promise<void> {
    clearTimeout(timeout);
    button.value?.classList.remove("transition");
    const roll = diceText.value;
    const key = await diceTool.roll(roll);
    const result = diceStore.getTotal(key);
    diceTool.state.history.push({ roll, result, player: coreStore.state.username });
    sendDiceRollResult({
        player: coreStore.state.username,
        roll,
        result,
        shareWithAll: diceTool.state.shareWithAll,
    });
    diceArray.value = [];
}
</script>

<template>
    <div id="dice" class="tool-detail">
        <div id="dice-history" ref="historyDiv">
            <template v-for="r of diceTool.state.history" :key="r.roll">
                <div class="roll" :title="r.player" @click="reroll(r.roll)">{{ r.roll }}</div>
                <div class="result" :title="r.player">{{ r.result }}</div>
            </template>
        </div>
        <div id="dice-options">
            <div>Share with all</div>
            <button
                class="slider-checkbox"
                :aria-pressed="diceTool.state.shareWithAll"
                @click="diceTool.state.shareWithAll = !diceTool.state.shareWithAll"
            ></button>
            <div>Auto roll</div>
            <button
                class="slider-checkbox"
                :aria-pressed="diceTool.state.autoRoll"
                @click="diceTool.state.autoRoll = !diceTool.state.autoRoll"
            ></button>
        </div>
        <div id="dice-picker">
            <div @click="add(20)">20</div>
            <div @click="add(12)">12</div>
            <div @click="add(10)">10</div>
            <div @click="add(8)">8</div>
            <div @click="add(6)">6</div>
            <div @click="add(4)">4</div>
        </div>
        <div>{{ diceText }}</div>
        <div id="dice-input">
            <button @click="diceArray = []">clear</button>
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

        max-height: 3em;
        overflow-y: auto;
        padding-right: 0.5em;
        padding-bottom: 0.5em;

        > .roll:hover {
            cursor: pointer;
        }

        > .result {
            text-align: right;
        }
    }

    #dice-options {
        display: grid;
        grid-template-columns: 1fr 1fr;
        justify-items: end;
        align-items: center;
        row-gap: 0.5em;

        padding-right: 0.5em;
        padding-top: 0.5em;
        border-top: solid 1px;
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
        justify-content: flex-end;

        > div {
            display: flex;
            align-items: center;
            justify-content: space-around;
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
