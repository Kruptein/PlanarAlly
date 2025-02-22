<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

import ColourPicker from "../../../core/components/ColourPicker.vue";
import { arrToToggleGroup } from "../../../core/components/toggleGroup";
import ToggleGroup from "../../../core/components/ToggleGroup.vue";
import { useModal } from "../../../core/plugins/modals/plugin";
import { getColour } from "../../colour";
import { gameState } from "../../systems/game/state";
import { DOOR_TOGGLE_MODES } from "../../systems/logic/door/models";
import { VisionBlock, visionBlocks } from "../../systems/properties/types";
import { DrawCategory, DrawMode, DrawShape, drawTool } from "../../tools/variants/draw";
import LogicPermissions from "../settings/shape/LogicPermissions.vue";

const { t } = useI18n();
const modals = useModal();

drawTool.setPromptFunction(modals.prompt);

const hasBrushSize = drawTool.hasBrushSize;
const modes = Object.values(DrawMode);
const categories = Object.values(DrawCategory);
const selected = drawTool.isActiveTool;
const shapes = Object.values(DrawShape);

const showPermissions = ref(false);

const defaultColoursApply = computed(
    () => drawTool.state.blocksMovement || drawTool.state.blocksVision !== VisionBlock.No || drawTool.state.isDoor,
);

const translationMapping = {
    modes: {
        [DrawMode.Normal]: t("game.ui.tools.DrawTool.normal"),
        [DrawMode.Reveal]: t("game.ui.tools.DrawTool.reveal"),
        [DrawMode.Hide]: t("game.ui.tools.DrawTool.hide"),
        [DrawMode.Erase]: t("game.ui.tools.DrawTool.erase"),
    },
    shapes: {
        [DrawShape.Square]: t("game.ui.tools.DrawTool.square"),
        [DrawShape.Circle]: t("game.ui.tools.DrawTool.circle"),
        [DrawShape.Polygon]: t("game.ui.tools.DrawTool.draw-polygon"),
        [DrawShape.Brush]: t("game.ui.tools.DrawTool.paint-brush"),
        [DrawShape.Text]: t("game.ui.tools.DrawTool.text"),
    },
    categories: {
        [DrawCategory.Shape]: t("game.ui.tools.DrawTool.shape-category"),
        [DrawCategory.Vision]: t("game.ui.tools.DrawTool.vision-category"),
        [DrawCategory.Logic]: t("game.ui.tools.DrawTool.logic-category"),
    },
};

const showBorderColour = computed(() => {
    if (drawTool.state.selectedShape === DrawShape.Brush) return false;
    if (drawTool.state.selectedShape === DrawShape.Polygon && !drawTool.state.isClosedPolygon) return false;
    return true;
});

const alerts = computed(() => {
    const a = new Set<string>();
    if (drawTool.state.blocksMovement || drawTool.state.blocksVision !== VisionBlock.No) {
        a.add(DrawCategory.Vision);
    }
    if (drawTool.state.isDoor) {
        a.add(DrawCategory.Logic);
    }
    return a;
});
</script>

<template>
    <div v-if="selected" class="tool-detail">
        <div id="draw-tool-categories">
            <div
                v-for="category in categories"
                :key="category"
                class="draw-category-option"
                :class="{
                    'draw-category-option-selected': drawTool.state.selectedCategory === category,
                    'draw-category-alert': drawTool.state.selectedCategory !== category && alerts.has(category),
                }"
                :title="translationMapping.categories[category]"
                @click="drawTool.state.selectedCategory = category"
            >
                <font-awesome-icon :icon="category" />
            </div>
        </div>
        <template v-if="drawTool.state.selectedCategory === DrawCategory.Shape">
            <div class="draw-center-header">{{ t("common.shape") }}</div>
            <div class="draw-select-group">
                <div
                    v-for="shape in shapes"
                    :key="shape"
                    class="draw-select-option"
                    :class="{ 'draw-select-option-selected': drawTool.state.selectedShape === shape }"
                    :title="translationMapping.shapes[shape]"
                    @click="drawTool.state.selectedShape = shape"
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
                    v-if="!(drawTool.state.preferDefaultColours && defaultColoursApply)"
                    v-model:colour="drawTool.state.fillColour"
                    class="draw-select-option"
                    :class="{ 'radius-right': !showBorderColour }"
                    :title="t('game.ui.tools.DrawTool.foreground_color')"
                />
                <ColourPicker
                    v-else
                    :colour="getColour(drawTool.colours.value.fill, undefined)"
                    class="draw-select-option"
                    :class="{ 'radius-right': !showBorderColour }"
                    :disabled="true"
                    title="Overriden by default colours, see vision tab"
                />
                <ColourPicker
                    v-if="!(drawTool.state.preferDefaultColours && defaultColoursApply)"
                    v-model:colour="drawTool.state.borderColour"
                    class="draw-select-option"
                    :v-show="showBorderColour"
                    :disabled="defaultColoursApply"
                    :title="t('game.ui.tools.DrawTool.background_color')"
                />
                <ColourPicker
                    v-else
                    :colour="getColour(drawTool.colours.value.stroke, undefined)"
                    class="draw-select-option"
                    :v-show="showBorderColour"
                    :disabled="true"
                    title="Overriden by default colours, see vision tab"
                />
            </div>
            <div v-show="drawTool.state.selectedShape === DrawShape.Polygon" class="draw-checkbox-line">
                <label for="polygon-close">{{ t("game.ui.tools.DrawTool.closed_polygon") }}</label>
                <input id="polygon-close" v-model="drawTool.state.isClosedPolygon" type="checkbox" />
            </div>
            <div v-show="hasBrushSize" class="draw-input-line">
                <label for="brush-size">{{ t("game.ui.tools.DrawTool.brush_size") }}</label>
                <input id="brush-size" v-model="drawTool.state.brushSize" type="input" />
            </div>
            <div v-show="drawTool.state.selectedShape === DrawShape.Text" class="draw-input-line">
                <label for="font-size">{{ t("game.ui.tools.DrawTool.font_size") }}</label>
                <input id="font-size" v-model="drawTool.state.fontSize" type="number" />
            </div>
        </template>
        <template v-else-if="drawTool.state.selectedCategory === DrawCategory.Vision">
            <div class="draw-center-header">{{ t("game.ui.tools.DrawTool.mode") }}</div>
            <div v-show="gameState.reactive.isDm" class="draw-select-group">
                <!-- <div
                    v-for="mode in modes"
                    :key="mode"
                    class="draw-select-option"
                    :class="{ 'draw-select-option-selected': drawTool.state.selectedMode === mode }"
                    @click="drawTool.state.selectedMode = mode"
                >
                    {{ translationMapping[mode] }}
                </div> -->
                <ToggleGroup
                    v-model="drawTool.state.selectedMode"
                    :options="arrToToggleGroup(modes, translationMapping.modes)"
                    active-color="#82c8a0"
                    color="white"
                    style="width: max-content"
                    :multi-select="false"
                />
            </div>
            <div class="draw-checkbox-line">
                <div>{{ t("game.ui.selection.edit_dialog.dialog.block_vision_light") }}</div>
            </div>
            <div style="display: flex">
                <div style="flex-grow: 1"></div>
                <ToggleGroup
                    v-model="drawTool.state.blocksVision"
                    :options="visionBlocks.map((v) => ({ label: VisionBlock[v], value: v }))"
                    :disabled="drawTool.state.selectedMode !== 'normal'"
                    :multi-select="false"
                    active-color="#82c8a0"
                    color="white"
                    style="width: max-content"
                />
            </div>

            <div class="draw-checkbox-line">
                <label for="vision-dialog-movement-block-toggle">
                    {{ t("game.ui.selection.edit_dialog.dialog.block_movement") }}
                </label>
                <div>
                    <input
                        id="vision-dialog-movement-block-toggle"
                        v-model="drawTool.state.blocksMovement"
                        type="checkbox"
                        :disabled="drawTool.state.selectedMode !== 'normal'"
                        @click="drawTool.state.blocksMovement = !drawTool.state.blocksMovement"
                    />
                </div>
            </div>

            <div class="draw-checkbox-line">
                <label
                    for="vision-dialog-colour-override-toggle"
                    title="When checked, the default colours as defined in your client settings will be used instead of the colours selected in the draw tool when relevant. This setting is ignored if no relevant blocker is active."
                >
                    Prefer default colours
                </label>
                <div>
                    <input
                        id="vision-dialog-colour-override-toggle"
                        v-model="drawTool.state.preferDefaultColours"
                        :disabled="!defaultColoursApply"
                        type="checkbox"
                    />
                </div>
            </div>
        </template>
        <template v-else>
            <teleport to="#teleport-modals">
                <LogicPermissions
                    v-model:visible="showPermissions"
                    v-model:permissions="drawTool.state.doorPermissions"
                />
            </teleport>
            <div class="draw-center-header">{{ t("game.ui.selection.edit_dialog.logic.logic") }}</div>
            <div class="header">{{ t("game.ui.selection.edit_dialog.logic.door") }}</div>
            <div class="draw-logic-flex">
                <label class="draw-logic-label" for="logic-dialog-door-toggle">{{ t("common.enabled") }}</label>
                <input
                    id="logic-dialog-door-toggle"
                    v-model="drawTool.state.isDoor"
                    class="draw-logic-checkbox"
                    type="checkbox"
                    @click="drawTool.state.isDoor = !drawTool.state.isDoor"
                />
            </div>
            <div class="draw-logic-flex">
                <label for="logic-dialog-door-toggles">{{ t("common.toggle") }}</label>
                <div class="selection-box">
                    <template v-for="mode of DOOR_TOGGLE_MODES" :key="mode">
                        <div
                            :class="{ 'selection-box-active': mode === drawTool.state.toggleMode }"
                            style="text-transform: capitalize"
                            @click="drawTool.state.toggleMode = mode"
                        >
                            {{ t(`common.${mode}`) }}
                        </div>
                    </template>
                </div>
            </div>
            <div class="draw-logic-flex">
                <label for="logic-dialog-door-config">{{ t("common.permission") }}</label>
                <font-awesome-icon id="logic-dialog-door-config" icon="cog" @click="showPermissions = true" />
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
        width: 40px;

        &:hover {
            cursor: pointer;
            background-color: #82c8a0;
        }
    }

    .draw-category-option-selected {
        background-color: #82c8a0;
    }

    .draw-category-alert {
        background-color: orangered;
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
        min-width: 37px;
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

.draw-logic-flex {
    display: flex;
    align-items: center;
    justify-content: space-between;

    > label {
        margin-right: 25px;
    }

    > svg,
    > input {
        justify-self: center;
        width: 200px !important;
    }
}

.selection-box {
    display: flex;
    flex-direction: row;
    margin: 16px 0;
    margin-left: 50px;

    > div {
        border: solid 1px;
        border-left: 0;
        padding: 7px;

        &:first-child {
            border: solid 1px;
            border-top-left-radius: 8px;
            border-bottom-left-radius: 8px;
        }

        &:last-child {
            border-top-right-radius: 8px;
            border-bottom-right-radius: 8px;
        }
    }
}

.selection-box > div:hover,
.selection-box-active {
    background-color: #82c8a0;
    cursor: pointer;
}
</style>

<style scoped lang="scss">
.tool-detail {
    display: block;
    min-height: 135px;
}

.header {
    display: flex;
    line-height: 0.1em;
    font-style: italic;
    overflow: hidden;
    padding: 0.5em;

    &:after {
        position: relative;
        width: 100%;
        border-bottom: 1px solid #000;
        content: "";
        margin-right: -100%;
        margin-left: 10px;
        display: inline-block;
    }
}
</style>
