<script setup lang="ts">
import { useI18n } from "vue-i18n";

import ColourPicker from "../../../../core/components/ColourPicker.vue";
import RotationSlider from "../../../../core/components/RotationSlider.vue";
import { SyncTo } from "../../../../core/models/types";
import { getValue } from "../../../../core/utils";
import { activeShapeStore } from "../../../../store/activeShape";
import { IdMap } from "../../../../store/shapeMap";
import { sendShapeMoveAura, sendShapeMoveTracker } from "../../../api/emits/shape/options";
import type { Aura, Tracker } from "../../../shapes/interfaces";

const { t } = useI18n();

const owned = activeShapeStore.hasEditAccess;
const isComposite = activeShapeStore.isComposite;

// Tracker

function updateTracker(tracker: string, delta: Partial<Tracker>, syncTo = true): void {
    if (!owned.value) return;
    if (activeShapeStore.state.uuid !== undefined)
        activeShapeStore.updateTracker(tracker, delta, syncTo === true ? SyncTo.SERVER : SyncTo.SHAPE);
}

function removeTracker(tracker: string): void {
    if (!owned.value) return;
    activeShapeStore.removeTracker(tracker, SyncTo.SERVER);
}

function toggleCompositeTracker(trackerId: string): void {
    if (!owned.value) return;
    if (!activeShapeStore.isComposite.value) return;

    const tracker = activeShapeStore.state.trackers.find((t) => t.uuid === trackerId);
    if (tracker === undefined) return;

    activeShapeStore.removeTracker(trackerId, SyncTo.SHAPE);

    const oldShape = tracker.shape;
    const newShape =
        oldShape === activeShapeStore.state.id ? activeShapeStore.state.parentUuid! : activeShapeStore.state.id!;

    activeShapeStore.pushTracker(tracker, newShape, SyncTo.SHAPE);
    sendShapeMoveTracker({
        shape: IdMap.get(oldShape)!.uuid,
        new_shape: IdMap.get(newShape)!.uuid,
        tracker: tracker.uuid,
    });
}

// Aura

function updateAura(aura: string, delta: Partial<Aura>, syncTo = true): void {
    if (!owned.value) return;
    if (delta.value !== undefined && (isNaN(delta.value) || delta.value < 0)) delta.value = 0;
    if (delta.dim !== undefined && (isNaN(delta.dim) || delta.dim < 0)) delta.dim = 0;
    if (activeShapeStore.state.uuid !== undefined)
        activeShapeStore.updateAura(aura, delta, syncTo === true ? SyncTo.SERVER : SyncTo.SHAPE);
}

function removeAura(aura: string): void {
    if (!owned.value) return;
    activeShapeStore.removeAura(aura, SyncTo.SERVER);
}

function toggleCompositeAura(auraId: string): void {
    if (!owned.value) return;
    if (!activeShapeStore.isComposite.value) return;

    const aura = activeShapeStore.state.auras.find((t) => t.uuid === auraId);
    if (aura === undefined) return;

    activeShapeStore.removeAura(auraId, SyncTo.SHAPE);

    const oldShape = aura.shape;
    const newShape =
        oldShape === activeShapeStore.state.id ? activeShapeStore.state.parentUuid! : activeShapeStore.state.id!;

    activeShapeStore.pushAura(aura, newShape, SyncTo.SHAPE);
    sendShapeMoveAura({ shape: IdMap.get(oldShape)!.uuid, new_shape: IdMap.get(newShape)!.uuid, aura: aura.uuid });
}
</script>

<template>
    <div style="display: contents">
        <div id="trackers-panel">
            <div class="spanrow header">{{ t("common.trackers") }}</div>
            <div class="aura" v-for="tracker in activeShapeStore.state.trackers" :key="tracker.uuid">
                <div class="summary">
                    <label class="name" :for="'check-' + tracker.uuid">{{ tracker.name }}</label>
                    <div
                        v-if="!tracker.temporary"
                        @click="removeTracker(tracker.uuid)"
                        :disabled="!owned"
                        :style="{ opacity: owned ? 1.0 : 0.3, textAlign: 'center' }"
                        :title="t('game.ui.selection.edit_dialog.dialog.remove_tracker')"
                    >
                        <font-awesome-icon icon="trash-alt" />
                    </div>
                </div>
                <input type="checkbox" :id="'check-' + tracker.uuid" style="display: none" />
                <div class="details">
                    <div>Name</div>
                    <div>
                        <input
                            type="text"
                            :value="tracker.name"
                            @change="updateTracker(tracker.uuid, { name: getValue($event) })"
                            :disabled="!owned"
                        />
                    </div>
                    <div>Value</div>
                    <div class="range">
                        <input
                            type="number"
                            :value="tracker.value"
                            @change="updateTracker(tracker.uuid, { value: parseFloat(getValue($event)) })"
                            :title="t('game.ui.selection.edit_dialog.dialog.current_value')"
                            :disabled="!owned"
                        />
                        <span style="padding: 5px">/</span>
                        <input
                            type="number"
                            :value="tracker.maxvalue"
                            min=""
                            @change="updateTracker(tracker.uuid, { maxvalue: parseFloat(getValue($event)) })"
                            :title="t('game.ui.selection.edit_dialog.dialog.current_value')"
                            :disabled="!owned"
                        />
                    </div>
                    <div>Public</div>
                    <div>
                        <input
                            type="checkbox"
                            :checked="tracker.visible"
                            @click="updateTracker(tracker.uuid, { visible: !tracker.visible })"
                            :disabled="!owned"
                            :title="t('common.toggle_public_private')"
                        />
                    </div>
                    <div v-show="isComposite">Shared for all variants</div>
                    <input
                        v-show="isComposite"
                        type="checkbox"
                        :checked="tracker.shape === activeShapeStore.state.parentUuid"
                        @click="toggleCompositeTracker(tracker.uuid)"
                        :disabled="!owned"
                        :title="t('common.toggle_public_private')"
                    />
                    <div>Display on token</div>
                    <div>
                        <input
                            type="checkbox"
                            :checked="tracker.draw"
                            @click="updateTracker(tracker.uuid, { draw: !tracker.draw })"
                            :disabled="!owned"
                            :title="t('common.toggle_draw')"
                        />
                    </div>
                    <div v-if="tracker.draw">Primary Colour</div>
                    <div v-if="tracker.draw">
                        <ColourPicker
                            :colour="tracker.primaryColor"
                            @input:colour="updateTracker(tracker.uuid, { primaryColor: $event }, false)"
                            @update:colour="updateTracker(tracker.uuid, { primaryColor: $event })"
                            :disabled="!owned"
                        />
                    </div>
                    <div v-if="tracker.draw">Secondary Colour</div>
                    <div v-if="tracker.draw">
                        <ColourPicker
                            :colour="tracker.secondaryColor"
                            @input:colour="updateTracker(tracker.uuid, { secondaryColor: $event }, false)"
                            @update:colour="updateTracker(tracker.uuid, { secondaryColor: $event })"
                            :disabled="!owned"
                        />
                    </div>
                </div>
            </div>
            <div class="spanrow header">{{ t("common.auras") }}</div>
            <div class="aura" v-for="aura of activeShapeStore.state.auras" :key="aura.uuid">
                <div class="summary">
                    <label class="name" :for="'check-' + aura.uuid">{{ aura.name }}</label>
                    <div
                        v-if="!aura.temporary"
                        @click="removeAura(aura.uuid)"
                        :disabled="!owned"
                        :style="{ opacity: owned ? 1.0 : 0.3, textAlign: 'center' }"
                        :title="t('game.ui.selection.edit_dialog.dialog.delete_aura')"
                    >
                        <font-awesome-icon icon="trash-alt" />
                    </div>
                    <button
                        class="slider-checkbox"
                        @click="updateAura(aura.uuid, { active: !aura.active })"
                        :aria-pressed="aura.active"
                    ></button>
                </div>
                <input type="checkbox" :id="'check-' + aura.uuid" style="display: none" />
                <div class="details">
                    <div>Name</div>
                    <div>
                        <input
                            type="text"
                            :value="aura.name"
                            @change="updateAura(aura.uuid, { name: getValue($event) })"
                            :disabled="!owned"
                        />
                    </div>
                    <div>Range</div>
                    <div class="range">
                        <input
                            type="number"
                            :value="aura.value"
                            @input="updateAura(aura.uuid, { value: parseFloat(getValue($event)) }, false)"
                            @change="updateAura(aura.uuid, { value: parseFloat(getValue($event)) })"
                            :title="t('game.ui.selection.edit_dialog.dialog.current_value')"
                            :disabled="!owned"
                        />
                        <span>/</span>
                        <input
                            type="number"
                            :value="aura.dim"
                            min="0"
                            @input="updateAura(aura.uuid, { dim: parseFloat(getValue($event)) }, false)"
                            @change="updateAura(aura.uuid, { dim: parseFloat(getValue($event)) })"
                            :title="t('game.ui.selection.edit_dialog.dialog.dim_value')"
                            :disabled="!owned"
                        />
                    </div>
                    <div>Angle</div>
                    <div class="angle">
                        <input
                            type="number"
                            :value="aura.angle"
                            @change="updateAura(aura.uuid, { angle: parseFloat(getValue($event)) })"
                            min="1"
                            max="360"
                        />
                        <RotationSlider
                            :angle="aura.direction"
                            :show-number-input="true"
                            @input="
                                (direction) => {
                                    updateAura(aura.uuid, { direction }, false);
                                }
                            "
                            @change="
                                (direction) => {
                                    updateAura(aura.uuid, { direction });
                                }
                            "
                        />
                    </div>
                    <div>Colour</div>
                    <div class="colour">
                        Aura:
                        <ColourPicker
                            :colour="aura.colour"
                            @input:colour="updateAura(aura.uuid, { colour: $event }, false)"
                            @update:colour="updateAura(aura.uuid, { colour: $event })"
                            :disabled="!owned"
                        />
                        Border:
                        <ColourPicker
                            :colour="aura.borderColour"
                            @input:colour="updateAura(aura.uuid, { borderColour: $event }, false)"
                            @update:colour="updateAura(aura.uuid, { borderColour: $event })"
                            :disabled="!owned"
                        />
                    </div>
                    <div class="option">
                        <div>Public</div>
                        <input
                            type="checkbox"
                            :checked="aura.visible"
                            @click="updateAura(aura.uuid, { visible: !aura.visible })"
                            :disabled="!owned"
                            :title="t('common.toggle_public_private')"
                        />
                    </div>
                    <div class="option">
                        <div>Light source</div>
                        <input
                            type="checkbox"
                            :checked="aura.visionSource"
                            @click="updateAura(aura.uuid, { visionSource: !aura.visionSource })"
                            :disabled="!owned"
                            :title="t('game.ui.selection.edit_dialog.dialog.toggle_light_source')"
                        />
                    </div>
                    <div v-show="isComposite">Shared for all variants {{ isComposite }}</div>
                    <input
                        v-show="isComposite"
                        type="checkbox"
                        @click="toggleCompositeAura(aura.uuid)"
                        :disabled="!owned"
                        :title="t('common.toggle_public_private')"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
#trackers-panel {
    background-color: white;
    min-width: 15vw;
}

input[type="text"] {
    padding: 2px;
}

input[type="number"] {
    width: 65px;
}

.aura {
    display: flex;
    flex-direction: column;
    padding: 0.2em 1em;
    background-color: white;

    &:last-child {
        padding-bottom: 1em;
    }

    .summary {
        display: flex;
        align-content: center;
        justify-content: space-between;

        color: white;
        background-color: brown;
        padding: 0.6em 1.2em;
        border-radius: 20px;

        font-weight: bold;

        label {
            flex: 1;
        }

        label:hover {
            cursor: pointer;
        }

        button {
            margin-left: 1em;
            padding-left: 2.5em;
        }
    }

    .details {
        box-sizing: border-box;
        display: none;
        width: 90%;
        align-self: center;

        border: solid 2px brown;
        border-top: 0;
        border-bottom-left-radius: 20px;
        border-bottom-right-radius: 20px;
        padding: 1em;

        .range {
            display: flex;
            justify-content: space-between;

            input {
                width: 5em;
            }
        }

        .angle {
            display: flex;
            justify-content: space-between;
        }

        .colour {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .option {
            display: flex;
            justify-content: space-between;
            padding-right: 2em;
        }
    }

    input:checked + .details {
        display: grid;
        grid-template-columns: 1fr minmax(180px, 1fr);
        align-items: center;
        row-gap: 0.5em;
    }
}
</style>
