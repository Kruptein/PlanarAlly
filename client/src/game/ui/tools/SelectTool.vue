<script setup lang="ts">
import type { CSSProperties } from "vue";
import { computed, onMounted, ref, toRef, watch } from "vue";

import { selectionState } from "../../layers/selection";
import type { Polygon } from "../../shapes/variants/polygon";
import { selectTool } from "../../tools/variants/select";

import { useToolPosition } from "./toolPosition";

const right = ref("0px");
const arrow = ref("0px");

const hasSelection = selectTool.hasSelection;
const selected = selectTool.isActiveTool;
const showRuler = selectTool.showRuler;
const toolStyle = computed(() => ({ "--detailRight": right.value, "--detailArrow": arrow.value } as CSSProperties));

const polygonUiLeft = selectTool.polygonUiLeft;
const polygonUiTop = selectTool.polygonUiTop;
const polygonUiAngle = selectTool.polygonUiAngle;
const polygonUiVisible = selectTool.polygonUiVisible;
const polygonUiSizeX = selectTool.polygonUiSizeX;
const polygonUiSizeY = selectTool.polygonUiSizeY;
const polygonUiVertex = selectTool.polygonUiVertex;

onMounted(() => {
    ({ right: right.value, arrow: arrow.value } = useToolPosition(selectTool.toolName));
    selectTool.checkRuler();
    watch(toRef(selectionState.state, "selection"), () => {
        selectTool.resetRotationHelper();
    });
});

function toggleShowRuler(event: MouseEvent): void {
    const state = (event.target as HTMLButtonElement).getAttribute("aria-pressed") ?? "false";
    selectTool.showRuler.value = state === "false";
    selectTool.checkRuler();
}

function cutPolygon(): void {
    const selection = selectionState.get({ includeComposites: false })[0] as Polygon;
    selection.cutPolygon(selectTool.polygonTracer!.refPoint);
}

function addPoint(): void {
    const selection = selectionState.get({ includeComposites: false })[0] as Polygon;
    selection.addPoint(selectTool.polygonTracer!.refPoint);
}

function removePoint(): void {
    const selection = selectionState.get({ includeComposites: false })[0] as Polygon;
    selection.removePoint(selectTool.polygonTracer!.refPoint);
}
</script>

<template>
    <div id="polygon-edit">
        <div @click="removePoint" v-if="polygonUiVertex"><font-awesome-icon icon="trash-alt" /></div>
        <div @click="addPoint" v-else><font-awesome-icon icon="plus-square" /></div>
        <div @click="cutPolygon"><font-awesome-icon icon="cut" /></div>
    </div>

    <div id="ruler" class="tool-detail" v-if="selected && hasSelection" :style="toolStyle">
        <button @click="toggleShowRuler" :aria-pressed="showRuler">Show ruler</button>
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

#ruler {
    display: flex;
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
