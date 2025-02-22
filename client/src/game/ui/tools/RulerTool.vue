<script setup lang="ts">
import { useI18n } from "vue-i18n";

import { rulerTool } from "../../tools/variants/ruler";

const { t } = useI18n();

const showPublic = rulerTool.showPublic;

function toggle(event: MouseEvent): void {
    const state = (event.target as HTMLButtonElement).getAttribute("aria-pressed") ?? "false";
    rulerTool.showPublic.value = state === "false";
}

function toggleGridMode(event: MouseEvent): void {
    const state = (event.target as HTMLButtonElement).getAttribute("aria-pressed") ?? "false";
    rulerTool.gridMode.value = state === "false";
}
</script>

<template>
    <div v-if="rulerTool.isActiveTool" id="ruler" class="tool-detail">
        <button :aria-pressed="showPublic" @click="toggle">{{ t("game.ui.tools.RulerTool.share") }}</button>
        <button :aria-pressed="rulerTool.gridMode.value" @click="toggleGridMode">
            {{ t("game.ui.tools.RulerTool.grid") }}
        </button>
    </div>
</template>

<style scoped lang="scss">
#ruler {
    display: flex;
    flex-direction: column;
}

button {
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

    &:hover {
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

    &::before,
    &::after {
        content: "";
        position: absolute;
        height: 1.1em;
        transition: all 0.25s ease;
    }

    &::before {
        left: 0;
        top: 0.4em;
        width: 2.6em;
        border: 0.2em solid #767676;
        background: #767676;
        border-radius: 1.1em;
    }

    &::after {
        left: 0;
        top: 0.45em;
        background-color: #fff;
        background-position: center center;
        border-radius: 50%;
        width: 1.1em;
        border: 0.15em solid #767676;
    }

    &[aria-pressed="true"] {
        &::after {
            left: 1.6em;
            border-color: #36a829;
            color: #36a829;
        }

        &::before {
            background-color: #36a829;
            border-color: #36a829;
        }
    }
}
</style>
