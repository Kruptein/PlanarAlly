<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";

import { type InitiativeEffect } from "../../models/initiative";

const emit = defineEmits<{
    (e: "submit", effect: InitiativeEffect): void;
    (e: "cancel"): void;
}>();

const { t } = useI18n();

const defaultName = t("game.ui.initiative.new_effect");
const defaultTurns = "10";

const name = ref("");
const turns = ref<string | null>(defaultTurns);
const infinite = ref(false);

function validateTurns(): void {
    if (turns.value === null) {
        if (infinite.value) return;
        turns.value = "0";
    }
    if (+turns.value < 0) turns.value = "0";
}

function getTurns(): string | null {
    validateTurns();
    if (infinite.value) return null;
    if (turns.value === "") return defaultTurns;
    return turns.value;
}

function submitNewEffect(): void {
    emit("submit", { name: name.value === "" ? defaultName : name.value, turns: getTurns(), highlightsActor: false });
}
</script>

<template>
    <div class="add-effect-dialog">
        <div class="first-row">
            <input
                v-model="name"
                class="add-effect-name effect-input-box"
                :placeholder="defaultName"
                :title="t('game.ui.initiative.effect_name_hint')"
                style="width: 0; flex: 3 1 0"
                @keyup.enter="submitNewEffect()"
            />
            <Transition name="grow">
                <input
                    v-if="!infinite"
                    v-model="turns"
                    class="turn-input effect-input-box"
                    placeholder="10"
                    :title="t('game.ui.initiative.effect_duration_hint')"
                    type="number"
                    min="0"
                    @blur="validateTurns()"
                    @keyup.enter="submitNewEffect()"
                />
            </Transition>
        </div>
        <div class="second-row">
            <button class="create-effect-button" tabindex="-1" @click="emit('cancel')">{{ t("common.cancel") }}</button>
            <div class="sub-row-group">
                <div
                    :title="t('game.ui.initiative.infinite_toggle_hint')"
                    class="sub-row-group"
                    @click="infinite = !infinite"
                >
                    <span class="infinite-checkbox-label">{{ t("game.ui.initiative.infinite_toggle") }}</span>
                    <div style="font-size: 9pt">
                        <button class="infinite-checkbox" :aria-pressed="infinite" @keydown.tab.stop=""></button>
                    </div>
                </div>
                <button class="create-effect-button" @keydown.tab.stop="" @click="submitNewEffect()">
                    {{ t("common.add") }}
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.add-effect-dialog {
    transition:
        all 0.3s ease,
        box-shadow 0.1s linear,
        opacity 0.2s ease,
        max-height 0.3s ease;
    width: 270px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    border-bottom-left-radius: 5px;
    border-bottom-right-radius: 5px;
    border: solid 2px #82c8a0;
    border-top: none;
    max-height: 3.4em;
    align-self: center;

    .first-row,
    .second-row {
        display: flex;
        flex-direction: row;
        align-items: center;
        margin: 0 2px;
        padding: 2px 0;
        width: calc(100% - 4px);
    }
    .first-row {
        justify-content: space-around;
    }
    .second-row {
        justify-content: space-between;
    }
}

.sub-row-group {
    display: flex;
    flex-direction: row;
    align-items: center;
    user-select: none;
}

.effect-input-box {
    font-size: 12pt;
    height: 1.4em;
    margin-top: 2px;
    transition: all 0.3s ease;
    border-radius: 5px;
    border: solid 2px #82c8a0;
    outline: solid 1px transparent;
    &:focus {
        border: solid 2px #82c8a0;
        outline: solid 1px #82c8a0;
        box-shadow: 0px 0px 5px 1px #82c8a0;
    }
}

.turn-input {
    max-width: 5em;
    width: 0;
    flex: 1 1 0;
    margin-left: 2px;
}

.infinite-checkbox-label:hover + div > .infinite-checkbox,
.infinite-checkbox:focus,
.infinite-checkbox:hover {
    cursor: pointer;

    &::before {
        box-shadow: 0 0 0.5em #333;
    }

    &::after {
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='50' cy='50' r='50' fill='rgba(0,0,0,.25)'/%3E%3C/svg%3E");
        background-size: 30%;
        background-repeat: no-repeat;
        background-position: center center;
    }
}

.infinite-checkbox-label:hover {
    cursor: pointer;
}

.infinite-checkbox {
    display: block;
    box-sizing: border-box;
    border: none;
    color: inherit;
    background: none;
    font: inherit;
    line-height: inherit;
    text-align: left;
    padding: 0.4em 0 0.4em 4em;
    position: relative;
    outline: none;

    &::before,
    &::after {
        content: "";
        position: absolute;
        height: 1.1em;
        transition: all 0.25s ease;
    }

    &::before {
        left: 0.2em;
        top: -0.25em;
        width: 2.6em;
        border: 0.2em solid #767676;
        background: #767676;
        border-radius: 1.1em;
    }

    &::after {
        left: 0.25em;
        top: -0.2em;
        background-color: #fff;
        background-position: center center;
        border-radius: 50%;
        width: 1.1em;
        border: 0.15em solid #767676;
    }

    &[aria-pressed="true"] {
        &::after {
            left: 1.75em;
            border-color: #36a829;
            color: #36a829;
        }

        &::before {
            background-color: #36a829;
            border-color: #36a829;
        }
    }
}

.create-effect-button {
    font-size: 10pt;
    line-height: 10pt;
    display: flex;
    align-items: center;
    justify-content: center;
    border: solid 2px #82c8a0;
    border-radius: 5px;
    outline: solid 1px transparent;
    user-select: none;
    padding: 2px 4px;

    transition:
        transform 0.1s linear,
        background-color 0.05s linear,
        color 0.05s linear,
        opacity 0.3s linear,
        border-color 0.1s linear;

    &:focus {
        color: white;
        background-color: #82c8a0;
        cursor: pointer;
        outline: solid 1px #82c8a0;
    }
    &:hover:not(.disabled) {
        color: white;
        background-color: #82c8a0;
        cursor: pointer;
    }
    &:hover.disabled {
        cursor: auto;
    }
    &:active:not(.disabled) {
        transform: scale(100%);
    }
    &.disabled {
        border-color: #aaa;
        opacity: 50%;
    }
}

.grow-enter-from,
.grow-leave-to {
    max-width: 0;
    opacity: 0;
    margin-left: 0;
    margin-right: 0;
    padding-left: 0;
    padding-right: 0;
    border-left-width: 0;
    border-right-width: 0;
}

.grow-enter-active,
.grow-leave-active {
    transition: all 0.3s ease;
}
.grow-leave-active {
    margin-left: 0;
    margin-right: 0;
    padding-left: 0;
    padding-right: 0;
    border-left-width: 0;
    border-right-width: 0;
}
</style>
