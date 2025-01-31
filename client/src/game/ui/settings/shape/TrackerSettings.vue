<script setup lang="ts">
import { computed, type DeepReadonly } from "vue";
import { useI18n } from "vue-i18n";

import ColourPicker from "../../../../core/components/ColourPicker.vue";
import RotationSlider from "../../../../core/components/RotationSlider.vue";
import type { LocalId } from "../../../../core/id";
import { NO_SYNC, SERVER_SYNC } from "../../../../core/models/types";
import { getValue } from "../../../../core/utils";
import { activeShapeStore } from "../../../../store/activeShape";
import { getGlobalId } from "../../../id";
import { accessState } from "../../../systems/access/state";
import { auraSystem } from "../../../systems/auras";
import { sendShapeMoveAura } from "../../../systems/auras/emits";
import type { Aura, AuraId, UiAura } from "../../../systems/auras/models";
import { trackerSystem } from "../../../systems/trackers";
import { sendShapeMoveTracker } from "../../../systems/trackers/emits";
import type { Tracker, TrackerId, UiTracker } from "../../../systems/trackers/models";
import { uiState } from "../../../systems/ui/state";
import type { ModTrackerSetting } from "../../../systems/ui/types";

const { t } = useI18n();

const owned = accessState.hasEditAccess;
const isComposite = activeShapeStore.isComposite;

// Tracker

const trackers = computed(() => {
    const allTrackers = [...trackerSystem.state.parentTrackers, ...trackerSystem.state.trackers];
    const shapeId = activeShapeStore.state.id;
    if (shapeId === undefined) return [];
    // There are some "type instantation excessively deep" errors, so we're skipping the DeepReadonly here
    const modTrackers = uiState.reactive.modTrackerSettings as ModTrackerSetting[];
    return allTrackers.map((t) => ({
        tracker: t,
        mods: modTrackers.filter((ts) => ts.filter?.(shapeId, t.uuid) ?? true) as DeepReadonly<ModTrackerSetting>[],
    }));
});

function updateTracker(tracker: DeepReadonly<UiTracker>, delta: Partial<Tracker>, syncTo = true): void {
    if (!owned.value || activeShapeStore.state.id === undefined) return;

    if (tracker.temporary) {
        trackerSystem.add(tracker.shape, { ...tracker }, SERVER_SYNC);
    }
    trackerSystem.update(tracker.shape, tracker.uuid, delta, syncTo ? SERVER_SYNC : NO_SYNC);
}

function removeTracker(tracker: TrackerId): void {
    const id = trackerSystem.state.parentTrackers.some((t) => t.uuid === tracker)
        ? activeShapeStore.state.parentUuid
        : activeShapeStore.state.id;
    if (!owned.value || id === undefined) return;
    trackerSystem.remove(id, tracker, SERVER_SYNC);
}

function toggleCompositeTracker(shape: LocalId, trackerId: TrackerId): void {
    const id = activeShapeStore.state.id;
    if (!owned.value || id === undefined) return;
    if (!activeShapeStore.isComposite.value) return;

    const gId = getGlobalId(shape);
    const newShape = shape === id ? activeShapeStore.state.parentUuid! : id;
    const gIdNew = getGlobalId(newShape);

    if (gId === undefined || gIdNew === undefined) {
        console.error("Composite encountered unknown globalId");
        return;
    }

    const tracker = trackerSystem.get(shape, trackerId, true);
    if (tracker === undefined) return;

    trackerSystem.remove(shape, trackerId, NO_SYNC);

    trackerSystem.add(newShape, tracker, NO_SYNC);

    sendShapeMoveTracker({
        shape: gId,
        new_shape: gIdNew,
        tracker: tracker.uuid,
    });
}

// Aura

function updateAura(aura: DeepReadonly<UiAura>, delta: Partial<Aura>, syncTo = true): void {
    if (!owned.value || activeShapeStore.state.id === undefined) return;

    if (delta.value !== undefined && (isNaN(delta.value) || delta.value < 0)) delta.value = 0;
    if (delta.dim !== undefined && (isNaN(delta.dim) || delta.dim < 0)) delta.dim = 0;

    if (aura.temporary) {
        auraSystem.add(aura.shape, { ...aura }, SERVER_SYNC);
    }
    auraSystem.update(aura.shape, aura.uuid, delta, syncTo ? SERVER_SYNC : NO_SYNC);
}

function removeAura(aura: AuraId): void {
    const id = auraSystem.state.parentAuras.some((a) => a.uuid === aura)
        ? activeShapeStore.state.parentUuid
        : activeShapeStore.state.id;
    if (!owned.value || id === undefined) return;
    auraSystem.remove(id, aura, SERVER_SYNC);
}

function toggleCompositeAura(shape: LocalId, auraId: AuraId): void {
    const id = activeShapeStore.state.id;
    if (!owned.value || id === undefined) return;
    if (!activeShapeStore.isComposite.value) return;

    const gId = getGlobalId(shape);
    const newShape = shape === id ? activeShapeStore.state.parentUuid! : id;
    const gIdNew = getGlobalId(newShape);

    if (gId === undefined || gIdNew === undefined) {
        console.error("Composite encountered unknown globalId");
        return;
    }

    const aura = auraSystem.get(shape, auraId, true);
    if (aura === undefined) return;

    auraSystem.remove(shape, auraId, NO_SYNC);
    auraSystem.add(newShape, aura, NO_SYNC);

    sendShapeMoveAura({
        shape: gId,
        new_shape: gIdNew,
        aura: aura.uuid,
    });
}

// mods

// const modTrackers = computed(() => {
//     for (const tab of uiState.reactive.modTrackerSettings) {
//         if (tab.filter?.(activeShapeStore.state.id!, ) ?? true) tabs.push(tab);
//     }
// })
</script>

<template>
    <div style="display: contents">
        <div id="trackers-panel">
            <div class="spanrow header">{{ t("common.trackers") }}</div>
            <div v-for="{ tracker, mods } of trackers" :key="tracker.uuid" class="aura">
                <div class="summary">
                    <label class="name" :for="'check-' + tracker.uuid">{{ tracker.name }}</label>
                    <div
                        v-if="!tracker.temporary"
                        :disabled="!owned"
                        :style="{ opacity: owned ? 1.0 : 0.3, textAlign: 'center' }"
                        :title="t('game.ui.selection.edit_dialog.dialog.remove_tracker')"
                        @click="removeTracker(tracker.uuid)"
                    >
                        <font-awesome-icon icon="trash-alt" />
                    </div>
                </div>
                <input :id="'check-' + tracker.uuid" type="checkbox" style="display: none" />
                <div class="details">
                    <div>{{ t("common.name") }}</div>
                    <div>
                        <input
                            type="text"
                            :value="tracker.name"
                            :disabled="!owned"
                            @change="updateTracker(tracker, { name: getValue($event) })"
                        />
                    </div>
                    <div>{{ t("common.value") }}</div>
                    <div class="range">
                        <input
                            type="number"
                            :value="tracker.value"
                            :title="t('game.ui.selection.edit_dialog.dialog.current_value')"
                            :disabled="!owned"
                            @change="updateTracker(tracker, { value: parseFloat(getValue($event)) })"
                        />
                        <span style="padding: 5px">/</span>
                        <input
                            type="number"
                            :value="tracker.maxvalue"
                            min=""
                            :title="t('game.ui.selection.edit_dialog.dialog.current_value')"
                            :disabled="!owned"
                            @change="updateTracker(tracker, { maxvalue: parseFloat(getValue($event)) })"
                        />
                    </div>
                    <div>{{ t("common.public") }}</div>
                    <div>
                        <input
                            type="checkbox"
                            :checked="tracker.visible"
                            :disabled="!owned"
                            :title="t('common.toggle_public_private')"
                            @click="updateTracker(tracker, { visible: !tracker.visible })"
                        />
                    </div>
                    <div v-show="isComposite">
                        {{ t("game.ui.selection.edit_dialog.tracker.shared_for_all_variants") }}
                    </div>
                    <input
                        v-show="isComposite"
                        type="checkbox"
                        :checked="tracker.shape === activeShapeStore.state.parentUuid"
                        :disabled="!owned"
                        :title="t('common.toggle_public_private')"
                        @click="toggleCompositeTracker(tracker.shape, tracker.uuid)"
                    />
                    <div>{{ t("game.ui.selection.edit_dialog.tracker.display_on_token") }}</div>
                    <div>
                        <input
                            type="checkbox"
                            :checked="tracker.draw"
                            :disabled="!owned"
                            :title="t('common.toggle_draw')"
                            @click="updateTracker(tracker, { draw: !tracker.draw })"
                        />
                    </div>
                    <div v-if="tracker.draw">{{ t("common.primary_color") }}</div>
                    <div v-if="tracker.draw">
                        <ColourPicker
                            :colour="tracker.primaryColor"
                            :disabled="!owned"
                            @input:colour="updateTracker(tracker, { primaryColor: $event }, false)"
                            @update:colour="updateTracker(tracker, { primaryColor: $event })"
                        />
                    </div>
                    <div v-if="tracker.draw">{{ t("common.secondary_color") }}</div>
                    <div v-if="tracker.draw">
                        <ColourPicker
                            :colour="tracker.secondaryColor"
                            :disabled="!owned"
                            @input:colour="updateTracker(tracker, { secondaryColor: $event }, false)"
                            @update:colour="updateTracker(tracker, { secondaryColor: $event })"
                        />
                    </div>
                    <template v-for="mod of mods" :key="mod.name">
                        <div style="grid-column: 1/-1">- {{ mod.name }} ----</div>
                        <Component :is="mod.component" :tracker="tracker" />
                    </template>
                </div>
            </div>
            <div class="spanrow header">{{ t("common.auras") }}</div>
            <div
                v-for="aura of [...auraSystem.state.parentAuras, ...auraSystem.state.auras]"
                :key="aura.uuid"
                class="aura"
            >
                <div class="summary">
                    <label class="name" :for="'check-' + aura.uuid">{{ aura.name }}</label>
                    <div
                        v-if="!aura.temporary"
                        :disabled="!owned"
                        :style="{ opacity: owned ? 1.0 : 0.3, textAlign: 'center' }"
                        :title="t('game.ui.selection.edit_dialog.dialog.delete_aura')"
                        @click="removeAura(aura.uuid)"
                    >
                        <font-awesome-icon icon="trash-alt" />
                    </div>
                    <button
                        class="slider-checkbox"
                        :aria-pressed="aura.active"
                        @click="updateAura(aura, { active: !aura.active })"
                    ></button>
                </div>
                <input :id="'check-' + aura.uuid" type="checkbox" style="display: none" />
                <div class="details">
                    <div>{{ t("common.name") }}</div>
                    <div>
                        <input
                            type="text"
                            :value="aura.name"
                            :disabled="!owned"
                            @change="updateAura(aura, { name: getValue($event) })"
                        />
                    </div>
                    <div>{{ t("common.range") }}</div>
                    <div class="range">
                        <input
                            type="number"
                            :value="aura.value"
                            :title="t('game.ui.selection.edit_dialog.dialog.current_value')"
                            :disabled="!owned"
                            @input="updateAura(aura, { value: parseFloat(getValue($event)) }, false)"
                            @change="updateAura(aura, { value: parseFloat(getValue($event)) })"
                        />
                        <span>/</span>
                        <input
                            type="number"
                            :value="aura.dim"
                            min="0"
                            :title="t('game.ui.selection.edit_dialog.dialog.dim_value')"
                            :disabled="!owned"
                            @input="updateAura(aura, { dim: parseFloat(getValue($event)) }, false)"
                            @change="updateAura(aura, { dim: parseFloat(getValue($event)) })"
                        />
                    </div>
                    <div>{{ t("game.ui.selection.edit_dialog.tracker.angle") }}</div>
                    <div class="angle">
                        <input
                            type="number"
                            :value="aura.angle"
                            :disabled="!owned"
                            min="1"
                            max="360"
                            @change="updateAura(aura, { angle: parseFloat(getValue($event)) })"
                        />
                        <RotationSlider
                            :angle="aura.direction"
                            :show-number-input="true"
                            :disabled="!owned"
                            @input="
                                (direction) => {
                                    updateAura(aura, { direction }, false);
                                }
                            "
                            @change="
                                (direction) => {
                                    updateAura(aura, { direction });
                                }
                            "
                        />
                    </div>
                    <div>{{ t("common.colour") }}</div>
                    <div class="colour">
                        {{ t("common.aura") }}:
                        <ColourPicker
                            :colour="aura.colour"
                            :disabled="!owned"
                            @input:colour="updateAura(aura, { colour: $event }, false)"
                            @update:colour="updateAura(aura, { colour: $event })"
                        />
                        {{ t("game.ui.selection.edit_dialog.tracker.border") }}:
                        <ColourPicker
                            :colour="aura.borderColour"
                            :disabled="!owned"
                            @input:colour="updateAura(aura, { borderColour: $event }, false)"
                            @update:colour="updateAura(aura, { borderColour: $event })"
                        />
                    </div>
                    <div class="option">
                        <div>{{ t("common.public") }}</div>
                        <input
                            type="checkbox"
                            :checked="aura.visible"
                            :disabled="!owned"
                            :title="t('common.toggle_public_private')"
                            @click="updateAura(aura, { visible: !aura.visible })"
                        />
                    </div>
                    <div class="option">
                        <div>{{ t("game.ui.selection.edit_dialog.tracker.light_source") }}</div>
                        <input
                            type="checkbox"
                            :checked="aura.visionSource"
                            :disabled="!owned"
                            :title="t('game.ui.selection.edit_dialog.dialog.toggle_light_source')"
                            @click="updateAura(aura, { visionSource: !aura.visionSource })"
                        />
                    </div>
                    <div v-show="isComposite">
                        {{ t("game.ui.selection.edit_dialog.tracker.shared_for_all_variants") }}
                    </div>
                    <input
                        v-show="isComposite"
                        type="checkbox"
                        :disabled="!owned"
                        :title="t('common.toggle_public_private')"
                        @click="toggleCompositeAura(aura.shape, aura.uuid)"
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
    max-height: 60vh;
    overflow-y: auto;
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
