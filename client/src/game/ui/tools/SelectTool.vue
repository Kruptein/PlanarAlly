<script setup lang="ts">
import { onMounted, toRef } from "vue";
import { useI18n } from "vue-i18n";

import type { GlobalPoint } from "../../../core/geometry";
import { rotateAroundPoint } from "../../../core/math";
import type { Polygon } from "../../shapes/variants/polygon";
import { selectedSystem } from "../../systems/selected";
import { rulerTool } from "../../tools/variants/ruler";
import { selectTool } from "../../tools/variants/select";
import { selectToolState } from "../../tools/variants/select/state";

const { t } = useI18n();

const { $, _$ } = selectToolState;

const selected = selectTool.isActiveTool;

const polygonUiLeft = toRef($, "polygonUiLeft");
const polygonUiTop = toRef($, "polygonUiTop");
const polygonUiAngle = toRef($, "polygonUiAngle");
const polygonUiVisible = toRef($, "polygonUiVisible");
const polygonUiSizeX = toRef($, "polygonUiSizeX");
const polygonUiSizeY = toRef($, "polygonUiSizeY");

onMounted(() => {
    selectTool.checkRuler();
});

function getGlobalRefPoint(polygon: Polygon): GlobalPoint {
    return rotateAroundPoint(selectTool.polygonTracer!.refPoint, polygon.center, -polygon.angle);
}

function toggleShowRuler(event: MouseEvent): void {
    const state = (event.target as HTMLButtonElement).getAttribute("aria-pressed") ?? "false";
    _$.showRuler = state === "false";
    selectTool.checkRuler();
}

function cutPolygon(): void {
    const selection = selectedSystem.get({ includeComposites: false })[0] as Polygon;
    selection.cutPolygon(getGlobalRefPoint(selection));
}

function addPoint(): void {
    const selection = selectedSystem.get({ includeComposites: false })[0] as Polygon;
    selection.addPoint(getGlobalRefPoint(selection));
}

function removePoint(): void {
    const selection = selectedSystem.get({ includeComposites: false })[0] as Polygon;
    selection.removePoint(getGlobalRefPoint(selection));
}

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
    <div>
        <div id="polygon-edit">
            <div v-if="$.polygonUiVertex" @click="removePoint"><font-awesome-icon icon="trash-alt" /></div>
            <div v-else @click="addPoint"><font-awesome-icon icon="plus-square" /></div>
            <div @click="cutPolygon"><font-awesome-icon icon="cut" /></div>
        </div>

        <div v-if="selected && $.hasSelection" class="tool-detail">
            <button :aria-pressed="$.showRuler" @click="toggleShowRuler">
                {{ t("game.ui.tools.SelectTool.show_ruler") }}
            </button>
            <button :aria-pressed="rulerTool.showPublic.value" :disabled="!$.showRuler" @click="toggle">
                {{ t("game.ui.tools.RulerTool.share") }}
            </button>
            <button :aria-pressed="rulerTool.gridMode.value" :disabled="!$.showRuler" @click="toggleGridMode">
                {{ t("game.ui.tools.RulerTool.grid") }}
            </button>
        </div>
    </div>
</template>

<style scoped lang="scss">
#polygon-edit {
    visibility: v-bind(polygonUiVisible);
    position: absolute;
    display: flex;
    top: v-bind(polygonUiTop);
    left: v-bind(polygonUiLeft);
    transform: translate(v-bind(polygonUiSizeX), v-bind(polygonUiSizeY)) rotate(v-bind(polygonUiAngle));

    > div {
        background-color: white;
        border-radius: 25px;
        width: 25px;
        height: 25px;
        display: flex;
        justify-content: center;
        align-items: center;
    }
}

.tool-detail {
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

    &:disabled {
        opacity: 0.5;
    }

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
