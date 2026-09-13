<script setup lang="ts">
import { useI18n } from "vue-i18n";

import ColourPicker from "../../../core/components/ColourPicker.vue";
import { LightMode, lightTool } from "../../tools/variants/light";

const { t } = useI18n();

const selected = lightTool.isActiveTool;

const modes = [
    { value: LightMode.PointLight, label: t("game.ui.tools.LightTool.point"), icon: "lightbulb" },
    { value: LightMode.Ambient, label: t("game.ui.tools.LightTool.ambient"), icon: "sun" },
    { value: LightMode.Barrier, label: t("game.ui.tools.LightTool.barrier"), icon: "road-barrier" },
] as const;

function selectMode(mode: LightMode): void {
    lightTool.state.mode = mode;
}

function syncEditToAura(): void {
    lightTool.updateSelectedLightAura();
}

function onEditColourChange(colour: string): void {
    lightTool.state.pointLight.edit.colour = colour;
    syncEditToAura();
}
</script>

<template>
    <div v-if="selected" class="tool-detail light-tool">
        <div class="interaction-toggle">
            <div
                class="interaction-btn"
                :class="{ 'interaction-active': lightTool.state.interactionMode === 'place' }"
                @click="lightTool.setInteractionMode('place')"
            >
                <font-awesome-icon icon="plus" />
                <span>{{ $t("game.ui.tools.LightTool.place") }}</span>
            </div>
            <div
                class="interaction-btn"
                :class="{ 'interaction-active': lightTool.state.interactionMode === 'edit' }"
                @click="lightTool.setInteractionMode('edit')"
            >
                <font-awesome-icon icon="pencil-alt" />
                <span>{{ $t("game.ui.tools.LightTool.edit") }}</span>
            </div>
        </div>

        <template v-if="lightTool.state.interactionMode === 'place'">
            <div class="light-modes">
                <div
                    v-for="mode in modes"
                    :key="mode.value"
                    class="light-mode-tab"
                    :class="{ 'light-mode-active': lightTool.state.mode === mode.value }"
                    :title="mode.label"
                    @click="selectMode(mode.value)"
                >
                    <font-awesome-icon :icon="mode.icon" />
                    <span>{{ mode.label }}</span>
                </div>
            </div>

            <template v-if="lightTool.state.mode === LightMode.PointLight">
                <div class="light-row">
                    <label for="light-bright">{{ $t("game.ui.tools.LightTool.bright_radius") }}</label>
                    <input
                        id="light-bright"
                        v-model.number="lightTool.state.pointLight.create.brightRadius"
                        type="number"
                        min="0"
                        step="1"
                    />
                </div>
                <div class="light-row">
                    <label for="light-dim">{{ $t("game.ui.tools.LightTool.dim_radius") }}</label>
                    <input
                        id="light-dim"
                        v-model.number="lightTool.state.pointLight.create.dimRadius"
                        type="number"
                        min="0"
                        step="1"
                    />
                </div>
                <div class="light-row">
                    <label for="light-angle">{{ $t("game.ui.tools.LightTool.angle") }}</label>
                    <input
                        id="light-angle"
                        v-model.number="lightTool.state.pointLight.create.angle"
                        type="number"
                        min="0"
                        max="360"
                        step="5"
                    />
                </div>
                <div class="light-row">
                    <label>{{ $t("game.ui.tools.LightTool.colour") }}</label>
                    <ColourPicker v-model:colour="lightTool.state.pointLight.create.colour" />
                </div>
                <div class="light-hint">{{ $t("game.ui.tools.LightTool.click_to_place") }}</div>
            </template>

            <template v-else-if="lightTool.state.mode === LightMode.Ambient">
                <div class="light-hint">
                    {{ $t("game.ui.tools.LightTool.ambient_light_hint") }}
                </div>
                <div class="light-hint">{{ $t("game.ui.tools.LightTool.click_to_place_ambient") }}</div>
            </template>

            <template v-else-if="lightTool.state.mode === LightMode.Barrier">
                <div class="barrier-stepper">
                    <div
                        class="barrier-step"
                        :class="{
                            'step-active': !lightTool.state.barrierActive,
                            'step-completed': lightTool.state.barrierActive,
                        }"
                    >
                        <span class="step-indicator">
                            <font-awesome-icon v-if="lightTool.state.barrierActive" icon="check-circle" />
                            <span v-else>1</span>
                        </span>
                        <span class="step-label">{{ $t("game.ui.tools.LightTool.click_on_highlighted_vertex") }}</span>
                    </div>
                    <div class="barrier-step" :class="{ 'step-active': lightTool.state.barrierActive }">
                        <span class="step-indicator">2</span>
                        <span class="step-label">{{ $t("game.ui.tools.LightTool.add_extra_points") }}</span>
                    </div>
                    <div class="barrier-step" :class="{ 'step-active': lightTool.state.barrierActive }">
                        <span class="step-indicator">3</span>
                        <span class="step-label">{{
                            $t("game.ui.tools.LightTool.click_highlighted_point_to_close")
                        }}</span>
                    </div>
                </div>
                <div class="light-hint">
                    <template v-if="lightTool.state.barrierActive">
                        {{ $t("game.ui.tools.LightTool.press_escape_to_cancel") }}
                    </template>
                    <template v-else> {{ $t("game.ui.tools.LightTool.define_natural_barriers") }} </template>
                </div>
            </template>
        </template>

        <template v-else>
            <template v-if="lightTool.state.selectedShape !== undefined">
                <template v-if="lightTool.state.selectedShapeMode === LightMode.PointLight">
                    <div class="light-row">
                        <label for="edit-bright">{{ $t("game.ui.tools.LightTool.bright_radius") }}</label>
                        <input
                            id="edit-bright"
                            v-model.number="lightTool.state.pointLight.edit.brightRadius"
                            type="number"
                            min="0"
                            step="1"
                            @change="syncEditToAura"
                        />
                    </div>
                    <div class="light-row">
                        <label for="edit-dim">{{ $t("game.ui.tools.LightTool.dim_radius") }}</label>
                        <input
                            id="edit-dim"
                            v-model.number="lightTool.state.pointLight.edit.dimRadius"
                            type="number"
                            min="0"
                            step="1"
                            @change="syncEditToAura"
                        />
                    </div>
                    <div class="light-row">
                        <label for="edit-angle">{{ $t("game.ui.tools.LightTool.angle") }}</label>
                        <input
                            id="edit-angle"
                            v-model.number="lightTool.state.pointLight.edit.angle"
                            type="number"
                            min="0"
                            max="360"
                            step="5"
                            @change="syncEditToAura"
                        />
                    </div>
                    <div class="light-row">
                        <label>{{ $t("game.ui.tools.LightTool.colour") }}</label>
                        <ColourPicker
                            :colour="lightTool.state.pointLight.edit.colour"
                            @update:colour="onEditColourChange"
                        />
                    </div>
                </template>
                <button class="light-delete-btn" @click="lightTool.deleteShape()">
                    <font-awesome-icon icon="trash-alt" />
                    {{ $t("game.ui.tools.LightTool.delete_light") }}
                </button>
            </template>
            <div v-else class="light-hint">{{ $t("game.ui.tools.LightTool.click_light_on_map_to_select") }}</div>
        </template>
    </div>
</template>

<style scoped lang="scss">
.light-tool {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 350px;
}

.interaction-toggle {
    display: flex;
    margin-bottom: 2px;

    .interaction-btn {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
        padding: 5px 4px;
        cursor: pointer;
        border: solid 1px #82c8a0;
        font-size: 12px;
        font-weight: 600;

        &:first-child {
            border-radius: 8px 0 0 8px;
        }

        &:last-child {
            border-radius: 0 8px 8px 0;
        }

        &:hover {
            background-color: rgba(130, 200, 160, 0.25);
        }

        svg {
            font-size: 12px;
        }
    }

    .interaction-active {
        background-color: #82c8a0;

        &:hover {
            background-color: #82c8a0;
        }
    }
}

.light-modes {
    display: flex;
    margin-bottom: 4px;

    .light-mode-tab {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        padding: 6px 4px;
        cursor: pointer;
        border: solid 1px #82c8a0;
        font-size: 12px;

        &:first-child {
            border-radius: 8px 0 0 8px;
        }

        &:last-child {
            border-radius: 0 8px 8px 0;
        }

        &:hover {
            background-color: #82c8a0;
        }

        svg {
            font-size: 16px;
        }
    }

    .light-mode-active {
        background-color: #82c8a0;
    }
}

.light-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;

    label {
        white-space: nowrap;
    }

    input[type="number"] {
        width: 65px;
        padding: 2px 4px;
    }
}

.light-hint {
    font-size: 0.8em;
    font-style: italic;
    color: #888;
    text-align: center;
    margin-top: 4px;
}

.barrier-stepper {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.barrier-step {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 6px;
    border-radius: 4px;
    font-size: 0.85em;
    color: #666;
    transition: all 0.15s ease;

    .step-indicator {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 1.5px solid #666;
        font-size: 0.75em;
        font-weight: 600;
        flex-shrink: 0;
    }

    .step-label {
        em {
            font-weight: normal;
        }
    }

    &.step-active {
        color: #222;

        .step-indicator {
            border-color: #333;
            color: #333;
            background-color: rgba(0, 0, 0, 0.05);
        }
    }

    &.step-completed {
        color: #82c8a0;

        .step-indicator {
            border-color: #82c8a0;
            color: #82c8a0;
            font-size: 0.85em;
        }
    }
}

.light-delete-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    margin-top: 6px;
    padding: 5px 0;
    width: 100%;
    background: none;
    border: 1px solid #d66;
    border-radius: 4px;
    color: #d66;
    cursor: pointer;
    font-size: 0.85em;

    &:hover {
        background-color: rgba(221, 102, 102, 0.1);
    }
}
</style>
