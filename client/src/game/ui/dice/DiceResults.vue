<script setup lang="ts">
import { computed } from "vue";

import { diceState } from "../../systems/dice/state";

function close(): void {
    diceState.mutableReactive.result = undefined;
}

const roll = computed(() => diceState.reactive.result);

defineExpose({ close });
</script>

<template>
    <div v-if="roll !== undefined" id="results-container">
        <div id="results">
            <font-awesome-icon id="close-notes" :icon="['far', 'window-close']" @click="close" />
            <div id="dice-body">
                <div id="total">{{ roll.result }}</div>
                <div id="breakdown">
                    <template v-for="[index, part] of roll.parts.entries()" :key="index">
                        <div v-if="part.longResult" :title="part.longResult">
                            <div class="input">{{ part.input ?? "" }}</div>
                            <div class="value">{{ part.shortResult }}</div>
                        </div>
                        <div v-else class="value">{{ part.shortResult }}</div>
                    </template>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
#results-container {
    position: absolute;
    display: grid;
    justify-items: center;
    align-items: center;
    width: 100vw;
    height: 100vh;
}

#results {
    position: relative;
    display: flex;
    flex-direction: column;

    padding: 1.5rem 2rem;
    border-radius: 1rem;
    max-height: 80vh;

    background-color: white;

    pointer-events: all;

    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.33);

    font-family:
        "HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif;

    #close-notes {
        position: absolute;

        top: 0.75rem;
        right: 0.75rem;

        font-size: 1.25rem;
    }
}

#dice-body {
    width: auto;
    display: flex;
    flex-direction: column;
    align-items: center;

    #total {
        display: flex;
        justify-content: center;
        align-items: center;
        font-weight: bold;
        font-size: 30px;
        height: 60px;
        width: 60px;
        border-bottom: 1px solid;
        margin-bottom: 15px;
    }

    #breakdown {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-end;
        max-width: 25vw;
        font-size: 20px;

        > div {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 2em;
            margin-bottom: 15px;
        }

        .input {
            color: grey;
            font-size: 15px;
        }

        .value {
            font-weight: bold;
        }
    }
}
</style>
