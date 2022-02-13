<script setup lang="ts">
import { computed, onMounted, reactive, ref, toRef } from "vue";
import type { CSSProperties } from "vue";
import { useI18n } from "vue-i18n";

import ColourPicker from "../../../core/components/ColourPicker.vue";
import { useModal } from "../../../core/plugins/modals/plugin";
import { gameStore } from "../../../store/game";
import { DrawCategory, DrawMode, DrawShape, drawTool } from "../../tools/variants/draw";
import LogicPermissions from "../settings/shape/LogicPermissions.vue";

import { useToolPosition } from "./toolPosition";

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
const categories = Object.values(DrawCategory);
const selected = drawTool.isActiveTool;
const shapes = Object.values(DrawShape);
const toolStyle = computed(() => ({ "--detailRight": state.right, "--detailArrow": state.arrow } as CSSProperties));

const showConditions = ref(false);

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
    [DrawCategory.Shape]: t("game.ui.tools.DrawTool.shape-category"),
    [DrawCategory.Vision]: t("game.ui.tools.DrawTool.vision-category"),
    [DrawCategory.Logic]: t("game.ui.tools.DrawTool.logic-category"),
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
        <div id="draw-tool-categories">
            <div
                v-for="category in categories"
                :key="category"
                class="draw-category-option"
                :class="{ 'draw-category-option-selected': drawTool.state.selectedCategory === category }"
                @click="drawTool.state.selectedCategory = category"
                :title="translationMapping[category]"
            >
                <font-awesome-icon :icon="category" />
            </div>
        </div>
        <template v-if="drawTool.state.selectedCategory === 'square'">
            <div class="draw-center-header">{{ t("common.shape") }}</div>
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
            <div id="draw-colour-header">
                <div>{{ t("common.fill_color_short") }}</div>
                <div v-show="showBorderColour">{{ t("common.stroke_color_short") }}</div>
            </div>
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
            <div v-show="drawTool.state.selectedShape === DrawShape.Polygon" class="draw-checkbox-line">
                <label for="polygon-close">{{ t("game.ui.tools.DrawTool.closed_polygon") }}</label>
                <input type="checkbox" id="polygon-close" v-model="drawTool.state.isClosedPolygon" />
            </div>
            <div v-show="hasBrushSize" class="draw-input-line">
                <label for="brush-size">{{ t("game.ui.tools.DrawTool.brush_size") }}</label>
                <input type="input" id="brush-size" v-model="drawTool.state.brushSize" />
            </div>
            <div v-show="drawTool.state.selectedShape === DrawShape.Text" class="draw-input-line">
                <label for="font-size">{{ t("game.ui.tools.DrawTool.font_size") }}</label>
                <input type="number" id="font-size" v-model="drawTool.state.fontSize" />
            </div>
        </template>
        <template v-else-if="drawTool.state.selectedCategory === 'eye'">
            <div class="draw-center-header">{{ t("game.ui.tools.DrawTool.mode") }}</div>
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
            <div class="draw-checkbox-line">
                <div>{{ t("game.ui.selection.edit_dialog.dialog.block_vision_light") }}</div>
                <div>
                    <input
                        type="checkbox"
                        v-model="drawTool.state.blocksVision"
                        @click="drawTool.state.blocksVision = !drawTool.state.blocksVision"
                        :disabled="drawTool.state.selectedMode !== 'normal'"
                    />
                </div>
            </div>
            <div class="draw-checkbox-line">
                <div>{{ t("game.ui.selection.edit_dialog.dialog.block_movement") }}</div>
                <div>
                    <input
                        type="checkbox"
                        v-model="drawTool.state.blocksMovement"
                        @click="drawTool.state.blocksMovement = !drawTool.state.blocksMovement"
                        :disabled="drawTool.state.selectedMode !== 'normal'"
                    />
                </div>
            </div>
        </template>
        <template v-else>
            <teleport to="#teleport-modals">
                <LogicPermissions
                    v-model:visible="showConditions"
                    v-model:permissions="drawTool.state.doorConditions"
                />
            </teleport>
            <div class="draw-center-header">{{ t("game.ui.selection.edit_dialog.logic.logic") }}</div>
            <div class="draw-checkbox-options-line">
                <div>{{ t("game.ui.tools.DrawTool.door") }}</div>
                <div>
                    <input
                        type="checkbox"
                        v-model="drawTool.state.isDoor"
                        @click="drawTool.state.isDoor = !drawTool.state.isDoor"
                    />
                </div>
                <font-awesome-icon icon="cog" @click="showConditions = true" />
            </div>
        </template>
    </div>
</template>

<style lang="scss">
#draw-tool-categories {
    display: flex;
    flex-direction: column;
    align-items: center;

    position: absolute;
    left: -50px;
    bottom: 0;

    background-color: white;
    font-size: 20px;

    .draw-category-option {
        display: flex;
        justify-content: center;

        padding: 10px;
        width: 20px;

        &:hover {
            cursor: pointer;
            background-color: #82c8a0;
        }
    }

    .draw-category-option-selected {
        background-color: #82c8a0;
    }
}

.draw-center-header {
    display: flex;
    justify-content: center;
}

#draw-colour-header {
    margin-top: 5px;
    display: flex;
    justify-content: space-around;
}

.draw-checkbox-line {
    display: grid;
    grid-template-columns: auto 25px;
    margin-top: 5px;
}

.draw-input-line {
    display: grid;
    grid-template-columns: auto 50px;
    margin-top: 5px;
}

.draw-checkbox-options-line {
    display: grid;
    grid-template-columns: auto 25px 25px;
    align-items: center;
    margin-top: 5px;
}

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
    min-height: 125px;
}
</style>
