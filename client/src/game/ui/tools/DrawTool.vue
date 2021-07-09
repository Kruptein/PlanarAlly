<script setup lang="ts">
import { computed, onMounted, reactive, toRef } from "vue";
import { useI18n } from "vue-i18n";

import ColourPicker from "../../../core/components/ColourPicker.vue";
import { useModal } from "../../../core/plugins/modals/plugin";
import { gameStore } from "../../../store/game";
import { DrawMode, DrawShape, drawTool } from "../../tools/variants/draw";

import { useToolPosition } from "./toolPosition";

import type { CSSProperties } from "vue";

const { t } = useI18n();
const modals = useModal();

drawTool.setPromptFunction(modals.prompt);

const state = reactive({
    arrow: "0px",
    right: "0px",
});

const hasBrushSize = drawTool.hasBrushSize;
const isDm = toRef(gameStore.state, "isDm");
const modes = Object.values(DrawMode);
const selected = drawTool.isActiveTool;
const shapes = Object.values(DrawShape);
const toolStyle = { "--detailRight": state.right, "--detailArrow": state.arrow } as CSSProperties;

const translationMapping = {
    [DrawMode.Normal]: t("game.ui.tools.DrawTool.normal"),
    [DrawMode.Reveal]: t("game.ui.tools.DrawTool.reveal"),
    [DrawMode.Hide]: t("game.ui.tools.DrawTool.hide"),
    [DrawMode.Erase]: t("game.ui.tools.DrawTool.erase"),
    [DrawShape.Square]: t("game.ui.tools.DrawTool.square"),
    [DrawShape.Circle]: t("game.ui.tools.DrawTool.circle"),
    [DrawShape.Polygon]: t("game.ui.tools.DrawTool.draw-polygon"),
    [DrawShape.Brush]: t("game.ui.tools.DrawTool.paint-brush"),
    [DrawShape.Text]: t("game.ui.tools.DrawTool.text"),
};

onMounted(() => {
    ({ right: state.right, arrow: state.arrow } = useToolPosition(drawTool.toolName));
});

const showBorderColour = computed(() => {
    if (drawTool.state.selectedShape === DrawShape.Brush) return false;
    if (drawTool.state.selectedShape === DrawShape.Polygon && !drawTool.state.isClosedPolygon) return false;
    return true;
});
</script>

<template>
    <div class="tool-detail" v-if="selected" :style="toolStyle">
        <div v-show="isDm">{{ t("game.ui.tools.DrawTool.mode") }}</div>
        <div v-show="isDm" class="draw-select-group">
            <div
                v-for="mode in modes"
                :key="mode"
                class="draw-select-option"
                :class="{ 'draw-select-option-selected': drawTool.state.selectedMode === mode }"
                @click="drawTool.state.selectedMode = mode"
            >
                {{ translationMapping[mode] }}
            </div>
        </div>
        <div>{{ t("common.shape") }}</div>
        <div class="draw-select-group">
            <div
                v-for="shape in shapes"
                :key="shape"
                class="draw-select-option"
                :class="{ 'draw-select-option-selected': drawTool.state.selectedShape === shape }"
                @click="drawTool.state.selectedShape = shape"
                :title="translationMapping[shape]"
            >
                <font-awesome-icon :icon="shape" />
            </div>
        </div>
        <div>{{ t("common.colours") }}</div>
        <div class="draw-select-group">
            <ColourPicker
                class="draw-select-option"
                :class="{ 'radius-right': !showBorderColour }"
                :title="t('game.ui.tools.DrawTool.foreground_color')"
                v-model:colour="drawTool.state.fillColour"
            />
            <ColourPicker
                class="draw-select-option"
                :vShow="showBorderColour"
                :title="t('game.ui.tools.DrawTool.background_color')"
                v-model:colour="drawTool.state.borderColour"
            />
        </div>
        <div v-show="drawTool.state.selectedShape === DrawShape.Polygon" style="display: flex">
            <label for="polygon-close" style="flex: 5">{{ t("game.ui.tools.DrawTool.closed_polygon") }}</label>
            <input
                type="checkbox"
                id="polygon-close"
                style="flex: 1; align-self: center"
                v-model="drawTool.state.isClosedPolygon"
            />
        </div>
        <div v-show="drawTool.state.selectedShape === DrawShape.Text" style="display: flex">
            <label for="font-size" style="flex: 5">{{ t("game.ui.tools.DrawTool.font_size") }}</label>
            <input type="number" id="font-size" style="flex: 1; align-self: center" v-model="drawTool.state.fontSize" />
        </div>
        <div v-show="hasBrushSize" style="display: flex">
            <label for="brush-size" style="flex: 5">{{ t("game.ui.tools.DrawTool.brush_size") }}</label>
            <input
                type="input"
                id="brush-size"
                v-model="drawTool.state.brushSize"
                style="flex: 4; align-self: center; max-width: 100px"
            />
        </div>
    </div>
</template>

<style lang="scss">
.draw-select-group {
    display: flex;

    > .draw-select-option:first-of-type {
        border-top-left-radius: 10px;
        border-bottom-left-radius: 10px;
    }

    > .draw-select-option:last-of-type {
        border-top-right-radius: 10px;
        border-bottom-right-radius: 10px;
    }

    .draw-select-option {
        padding: 6px;
        border: solid 1px #82c8a0;
        border-radius: 0;
        flex: 1 1;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 13px;
        min-width: 25px;
    }

    .radius-right {
        border-top-right-radius: 10px;
        border-bottom-right-radius: 10px;
    }

    .draw-select-option-selected,
    .draw-select-option:hover {
        background-color: #82c8a0;
        cursor: pointer;
    }
}
</style>

<style scoped lang="scss">
.tool-detail {
    display: block;
}
</style>
