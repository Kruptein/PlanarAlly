<script setup lang="ts">
import { diceState } from "../../systems/dice/state";
import { DiceUiState } from "../../systems/dice/types";

import DiceCore from "./dice/DiceCore.vue";
import DiceMacroMenu from "./dice/DiceMacroMenu.vue";
import DiceMacros from "./dice/DiceMacros.vue";
</script>

<template>
    <div id="dice" class="tool-detail">
        <DiceMacroMenu v-model="diceState.mutableReactive.uiState" />
        <DiceCore v-show="diceState.reactive.uiState === DiceUiState.Roll" />
        <DiceMacros v-show="diceState.reactive.uiState !== DiceUiState.Roll" :active="diceState.reactive.uiState" />
    </div>
</template>

<style scoped lang="scss">
#dice {
    display: flex;
    flex-direction: row;
    align-items: flex-end;
    gap: 0.6rem;

    // Unset some tool-detail styles that are moved to dice-main
    background-color: unset;
    border: none;
    padding: unset;

    > .container {
        overflow: hidden;
        width: 26rem;

        background-color: white;
        border: solid 1px #2b2b2b;
        border-radius: 1rem;
        padding: 1rem;
    }
}
</style>
