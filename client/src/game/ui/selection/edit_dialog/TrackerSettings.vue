<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import ColorPicker from "@/core/components/colorpicker.vue";
import RotationSlider from "@/core/components/RotationSlider.vue";

import { SyncTo } from "../../../../core/models/types";
import { sendShapeMoveAura, sendShapeMoveTracker } from "../../../api/emits/shape/options";
import { Aura, Tracker } from "../../../shapes/interfaces";
import { ActiveShapeState, activeShapeStore } from "../../ActiveShapeStore";

@Component({ components: { ColorPicker, RotationSlider } })
export default class TrackerSettings extends Vue {
    get owned(): boolean {
        return activeShapeStore.hasEditAccess;
    }

    get shape(): ActiveShapeState {
        return activeShapeStore;
    }

    // Tracker

    updateTracker(tracker: string, delta: Partial<Tracker>): void {
        if (!this.owned) return;
        if (this.shape.uuid) this.shape.updateTracker({ tracker, delta, syncTo: SyncTo.SERVER });
    }

    removeTracker(tracker: string): void {
        if (!this.owned) return;
        this.shape.removeTracker({ tracker, syncTo: SyncTo.SERVER });
    }

    toggleCompositeTracker(trackerId: string): void {
        if (!this.owned) return;
        if (!this.shape.isComposite) return;

        const tracker = this.shape.trackers.find((t) => t.uuid === trackerId);
        if (tracker === undefined) return;

        this.shape.removeTracker({ tracker: trackerId, syncTo: SyncTo.SHAPE });

        const oldShape = tracker.shape;
        if (oldShape === this.shape.uuid) {
            tracker.shape = this.shape.parentUuid!;
        } else {
            tracker.shape = this.shape.uuid!;
        }

        this.shape.pushTracker({ tracker, shape: tracker.shape, syncTo: SyncTo.SHAPE });
        sendShapeMoveTracker({ shape: oldShape, new_shape: tracker.shape, tracker: tracker.uuid });
    }

    // Aura

    updateAura(aura: string, delta: Partial<Aura>, syncTo = true): void {
        if (!this.owned) return;
        if (delta.value !== undefined && (isNaN(delta.value) || delta.value < 0)) delta.value = 0;
        if (delta.dim !== undefined && (isNaN(delta.dim) || delta.dim < 0)) delta.dim = 0;
        if (this.shape.uuid)
            this.shape.updateAura({ aura, delta, syncTo: syncTo === true ? SyncTo.SERVER : SyncTo.SHAPE });
    }

    removeAura(aura: string): void {
        if (!this.owned) return;
        this.shape.removeAura({ aura, syncTo: SyncTo.SERVER });
    }

    toggleCompositeAura(auraId: string): void {
        if (!this.owned) return;
        if (!this.shape.isComposite) return;

        const aura = this.shape.auras.find((t) => t.uuid === auraId);
        if (aura === undefined) return;

        this.shape.removeAura({ aura: auraId, syncTo: SyncTo.SHAPE });

        const oldShape = aura.shape;
        if (oldShape === this.shape.uuid) {
            aura.shape = this.shape.parentUuid!;
        } else {
            aura.shape = this.shape.uuid!;
        }

        this.shape.pushAura({ aura, shape: aura.shape, syncTo: SyncTo.SHAPE });
        sendShapeMoveAura({ shape: oldShape, new_shape: aura.shape, aura: aura.uuid });
    }

    showAura = false;
    toggleAura(): void {
        this.showAura = !this.showAura;
    }
}
</script>

<template>
    <div style="display: contents">
        <div class="panel restore-panel">
            <div class="spanrow header" v-t="'common.trackers'"></div>
            <template v-for="tracker in shape.trackers">
                <input
                    :key="'name-' + tracker.uuid"
                    :value="tracker.name"
                    @change="updateTracker(tracker.uuid, { name: $event.target.value })"
                    type="text"
                    :placeholder="$t('common.name')"
                    style="grid-column-start: name"
                    :disabled="!owned"
                />
                <input
                    :key="'value-' + tracker.uuid"
                    :value="tracker.value"
                    @change="updateTracker(tracker.uuid, { value: parseFloat($event.target.value) })"
                    type="text"
                    :title="$t('game.ui.selection.edit_dialog.dialog.current_value')"
                    :disabled="!owned"
                />
                <span :key="'fspan-' + tracker.uuid">/</span>
                <input
                    :key="'maxvalue-' + tracker.uuid"
                    :value="tracker.maxvalue"
                    @change="updateTracker(tracker.uuid, { maxvalue: $event.target.value })"
                    type="text"
                    :title="$t('game.ui.selection.edit_dialog.dialog.current_value')"
                    :disabled="!owned"
                />
                <span :key="'sspan-' + tracker.uuid"></span>
                <div
                    v-show="shape.isComposite"
                    :key="'lock-' + tracker.uuid"
                    :style="{ opacity: tracker.shape !== shape.uuid ? 1.0 : 0.3, textAlign: 'center' }"
                    @click="toggleCompositeTracker(tracker.uuid)"
                    :disabled="!owned"
                    :title="$t('common.toggle_public_private')"
                >
                    <font-awesome-icon icon="lock" />
                </div>
                <div
                    :key="'visibility-' + tracker.uuid"
                    :style="{ opacity: tracker.visible ? 1.0 : 0.3, textAlign: 'center' }"
                    @click="updateTracker(tracker.uuid, { visible: !tracker.visible })"
                    :disabled="!owned"
                    :title="$t('common.toggle_public_private')"
                >
                    <font-awesome-icon icon="eye" />
                </div>
                <span :key="'tspan-' + tracker.uuid"></span>
                <div
                    v-if="!tracker.temporary"
                    :key="'remove-' + tracker.uuid"
                    @click="removeTracker(tracker.uuid)"
                    :disabled="!owned"
                    :style="{ opacity: owned ? 1.0 : 0.3, textAlign: 'center' }"
                    :title="$t('game.ui.selection.edit_dialog.dialog.remove_tracker')"
                >
                    <font-awesome-icon icon="trash-alt" />
                </div>
            </template>
            <div class="spanrow header" v-t="'common.auras'"></div>
        </div>
        <div class="aura" v-for="aura of shape.auras" :key="aura.uuid">
            <div class="summary">
                <label class="name" :for="'check-' + aura.uuid">{{ aura.name }}</label>
                <div
                    v-if="!aura.temporary"
                    @click="removeAura(aura.uuid)"
                    :disabled="!owned"
                    :style="{ opacity: owned ? 1.0 : 0.3, textAlign: 'center' }"
                    :title="$t('game.ui.selection.edit_dialog.dialog.delete_aura')"
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
                        @change="updateAura(aura.uuid, { name: $event.target.value })"
                        :disabled="!owned"
                    />
                </div>
                <div>Range</div>
                <div class="range">
                    <input
                        type="number"
                        :value="aura.value"
                        @input="updateAura(aura.uuid, { value: parseFloat($event.target.value) }, false)"
                        @change="updateAura(aura.uuid, { value: parseFloat($event.target.value) })"
                        :title="$t('game.ui.selection.edit_dialog.dialog.current_value')"
                        :disabled="!owned"
                    />
                    <span>/</span>
                    <input
                        type="number"
                        :value="aura.dim"
                        min="0"
                        @input="updateAura(aura.uuid, { dim: parseFloat($event.target.value) }, false)"
                        @change="updateAura(aura.uuid, { dim: parseFloat($event.target.value) })"
                        :title="$t('game.ui.selection.edit_dialog.dialog.dim_value')"
                        :disabled="!owned"
                    />
                </div>
                <div>Angle</div>
                <div class="angle">
                    <input
                        type="number"
                        :value="aura.angle"
                        @change="updateAura(aura.uuid, { angle: parseFloat($event.target.value) })"
                        min="1"
                        max="360"
                    />
                    <RotationSlider
                        :angle="aura.direction"
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
                    <color-picker
                        :color="aura.colour"
                        @input="updateAura(aura.uuid, { colour: $event }, false)"
                        @change="updateAura(aura.uuid, { colour: $event })"
                        :disabled="!owned"
                    />
                    Border:
                    <color-picker
                        :color="aura.borderColour"
                        @input="updateAura(aura.uuid, { borderColour: $event }, false)"
                        @change="updateAura(aura.uuid, { borderColour: $event })"
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
                        :title="$t('common.toggle_public_private')"
                    />
                </div>
                <div class="option">
                    <div>Light source</div>
                    <input
                        type="checkbox"
                        :checked="aura.visionSource"
                        @click="updateAura(aura.uuid, { visionSource: !aura.visionSource })"
                        :disabled="!owned"
                        :title="$t('game.ui.selection.edit_dialog.dialog.toggle_light_source')"
                    />
                </div>
                <div v-show="shape.isComposite">Shared for all variants {{ shape.isComposite }}</div>
                <input
                    v-show="shape.isComposite"
                    type="checkbox"
                    @click="toggleCompositeAura(aura.uuid)"
                    :disabled="!owned"
                    :title="$t('common.toggle_public_private')"
                />
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.panel {
    grid-template-columns: [name] 1fr [numerator] 25px [slash] 5px [denominator] 25px [colour] auto [lock] auto [visible] auto [light] auto [remove] auto [end];
    grid-column-gap: 10px;
    align-items: center;
    justify-items: center;
    min-height: 0;
    padding-bottom: 0;
}

input[type="text"] {
    padding: 2px;
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

            input {
                margin-right: 4em;
            }
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
        grid-template-columns: 1fr 1fr;
        align-items: center;
        row-gap: 0.5em;
    }
}
</style>
