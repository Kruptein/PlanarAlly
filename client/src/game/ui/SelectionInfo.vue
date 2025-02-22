<script setup lang="ts">
import { computed, ref, type DeepReadonly } from "vue";
import { useI18n } from "vue-i18n";

import RotationSlider from "../../core/components/RotationSlider.vue";
import { SERVER_SYNC } from "../../core/models/types";
import { activeShapeStore } from "../../store/activeShape";
import { getShape } from "../id";
import { accessState } from "../systems/access/state";
import { auraSystem } from "../systems/auras";
import type { Aura, AuraId } from "../systems/auras/models";
import { noteState } from "../systems/notes/state";
import { type ClientNote, NoteManagerMode } from "../systems/notes/types";
import { editNote, openNoteManager, popoutNote } from "../systems/notes/ui";
import { propertiesSystem } from "../systems/properties";
import { useShapeProps } from "../systems/properties/composables";
import { selectedState } from "../systems/selected/state";
import { trackerSystem } from "../systems/trackers";
import type { Tracker, TrackerId } from "../systems/trackers/models";
import { uiSystem } from "../systems/ui";

import TrackerInput from "./TrackerInput.vue";

const { t } = useI18n();
const shapeProps = useShapeProps();

const activeTracker = ref<Tracker | Aura | null>(null);

const trackers = computed(() => [...trackerSystem.state.parentTrackers, ...trackerSystem.state.trackers.slice(0, -1)]);

const auras = computed(() => [...auraSystem.state.parentAuras, ...auraSystem.state.auras.slice(0, -1)]);

const notes = computed(
    () =>
        noteState.reactive.shapeNotes
            .get1(selectedState.reactive.focus!)
            ?.map((note) => noteState.reactive.notes.get(note)!) ?? [],
);

function setLocked(): void {
    const shapeId = selectedState.raw.focus;
    if (accessState.hasEditAccess.value && shapeId !== undefined) {
        propertiesSystem.setLocked(shapeId, !shapeProps.value!.isLocked, SERVER_SYNC);
    }
}

function openEditDialog(): void {
    activeShapeStore.setShowEditDialog(true);
}

function changeValue(tracker: Tracker | Aura): void {
    if (selectedState.raw.focus === undefined || !accessState.hasEditAccess.value) return;

    activeTracker.value = tracker;
}

function setValue(data: { solution: number; relativeMode: boolean }): void {
    const tracker = activeTracker.value;

    const shapeId = selectedState.raw.focus;
    if (shapeId === undefined || tracker === null) return;
    activeTracker.value = null; // close the modal

    const value = data.relativeMode ? tracker.value + data.solution : data.solution;
    if (trackers.value.some((t) => t.uuid === tracker.uuid)) {
        trackerSystem.update(shapeId, tracker.uuid as TrackerId, { value }, SERVER_SYNC);
    } else {
        auraSystem.update(shapeId, tracker.uuid as AuraId, { value }, SERVER_SYNC);
        const sh = getShape(shapeId)!;
        sh.invalidate(false);
    }
}

// NOTES

const expandNotes = ref(false);

function openNotes(): void {
    const shapeId = selectedState.raw.focus;
    if (shapeId === undefined) return;

    openNoteManager(NoteManagerMode.List, shapeId);
}

function annotate(note: DeepReadonly<ClientNote>): void {
    uiSystem.setAnnotationText(note.text);
}
</script>

<template>
    <div>
        <TrackerInput :tracker="activeTracker" @submit="setValue" @close="activeTracker = null" />
        <template v-if="shapeProps">
            <div id="selection-menu">
                <div>
                    <div
                        id="selection-lock-button"
                        :title="t('game.ui.selection.SelectionInfo.lock')"
                        @click="setLocked"
                    >
                        <font-awesome-icon v-if="shapeProps.isLocked" icon="lock" />
                        <font-awesome-icon v-else icon="unlock" />
                    </div>
                    <div
                        id="selection-edit-button"
                        :title="t('game.ui.selection.SelectionInfo.open_shape_props')"
                        @click="openEditDialog"
                    >
                        <font-awesome-icon icon="edit" />
                    </div>
                    <div id="selection-name">{{ shapeProps.name }}</div>
                    <div id="selection-values" :class="{ noAccess: !accessState.hasEditAccess.value }">
                        <template v-for="tracker in trackers" :key="tracker.uuid">
                            <div>{{ tracker.name }}</div>
                            <div
                                class="selection-tracker-value"
                                :title="t('game.ui.selection.SelectionInfo.quick_edit_tracker')"
                                @click="changeValue(tracker)"
                            >
                                <template v-if="tracker.maxvalue === 0">
                                    {{ tracker.value }}
                                </template>
                                <template v-else>{{ tracker.value }} / {{ tracker.maxvalue }}</template>
                            </div>
                        </template>
                        <template v-for="aura in auras" :key="aura.uuid">
                            <div>{{ aura.name }}</div>
                            <div
                                class="selection-aura-value"
                                :title="t('game.ui.selection.SelectionInfo.quick_edit_aura')"
                            >
                                <button
                                    class="slider-checkbox"
                                    :aria-pressed="aura.active"
                                    @click="
                                        auraSystem.update(aura.shape, aura.uuid, { active: !aura.active }, SERVER_SYNC)
                                    "
                                />
                                <template v-if="aura.angle < 360">
                                    <RotationSlider
                                        :angle="aura.direction"
                                        :show-number-input="false"
                                        :disabled="!accessState.hasEditAccess.value"
                                        @input="
                                            (direction) =>
                                                auraSystem.update(aura.shape, aura.uuid, { direction }, SERVER_SYNC)
                                        "
                                        @change="
                                            (direction) =>
                                                auraSystem.update(aura.shape, aura.uuid, { direction }, SERVER_SYNC)
                                        "
                                    />
                                </template>
                            </div>
                        </template>
                    </div>
                </div>
                <div class="info-notes">
                    <div
                        :title="
                            notes.length > 0
                                ? expandNotes
                                    ? t('game.ui.selection.SelectionInfo.collapse_notes')
                                    : t('game.ui.selection.SelectionInfo.expand_notes')
                                : ''
                        "
                        :style="{ cursor: notes.length > 0 ? 'pointer' : 'default' }"
                        @click="expandNotes = !expandNotes"
                    >
                        <font-awesome-icon
                            icon="note-sticky"
                            :title="t('game.ui.selection.SelectionInfo.open_note_manager_title')"
                            @click.stop="openNotes"
                        />
                        {{ notes.length }} {{ t("game.ui.selection.SelectionInfo.notes") }}
                        <div style="flex-grow: 1"></div>
                        <font-awesome-icon
                            v-if="notes.length > 0"
                            :icon="expandNotes ? 'chevron-up' : 'chevron-down'"
                        />
                    </div>
                    <template v-if="expandNotes">
                        <div v-for="note of notes" :key="note.uuid" @pointerenter="annotate(note)">
                            <div>{{ note.title }}</div>
                            <div style="flex-grow: 1"></div>
                            <font-awesome-icon
                                :icon="['far', 'window-restore']"
                                :title="t('game.ui.notes.NoteDialog.pop_out')"
                                @click="popoutNote(note.uuid)"
                            />
                            <font-awesome-icon
                                icon="cog"
                                :title="t('game.ui.notes.NoteDialog.open_in_manager')"
                                @click="editNote(note.uuid)"
                            />
                        </div>
                    </template>
                </div>
            </div>
        </template>
    </div>
</template>

<style scoped lang="scss">
#selection-menu {
    position: absolute;
    pointer-events: auto;
    display: flex;
    flex-direction: column;
    top: 75px;
    right: 0;
    z-index: 10;
    opacity: 0.5;
    border-top-left-radius: 5px;
    border-bottom-left-radius: 5px;
    border-right: none;
    overflow: hidden;

    &:hover {
        opacity: 1;

        > div:first-child {
            background-color: #82c8a0;
        }
    }

    > div:first-child {
        display: flex;
        flex-direction: column;
        padding: 10px 35px 10px 10px;
        background-color: #eee;

        #selection-lock-button {
            position: absolute;
            right: 13px;
            top: 30px;
            cursor: pointer;
        }

        #selection-edit-button {
            position: absolute;
            right: 10px;
            top: 10px;
            cursor: pointer;
        }

        #selection-values {
            display: grid;
            grid-template-columns: [name] 1fr [value] max-content;
            grid-row-gap: 5px;

            .selection-tracker-value {
                justify-self: center;
                padding: 2px;

                &:hover {
                    cursor: pointer;
                    background-color: rgba(20, 20, 20, 0.2);
                }
            }

            .selection-aura-value {
                display: flex;
                flex-direction: row;
                gap: 10px;
                justify-self: center;
                padding: 2px;
            }

            &.noAccess .selection-tracker-value:hover {
                cursor: not-allowed;
            }

            &.noAccess .selection-aura-value:hover {
                cursor: not-allowed;
            }
        }

        #selection-name {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 10px;
        }
    }

    .info-notes {
        background-color: bisque;
        padding: 0.5rem;
        display: flex;
        flex-direction: column;

        > div {
            display: flex;
            align-items: center;
            margin-top: 0.25rem;

            &:hover {
                font-weight: bold;
            }

            svg {
                margin-left: 0.5rem;
            }

            &:first-child {
                margin-top: 0;

                svg {
                    margin: 0 0.5rem;
                }
            }

            &:nth-child(2) {
                margin-top: 1rem;
            }
        }
    }
}
</style>
