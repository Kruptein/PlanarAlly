<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

import { SERVER_SYNC } from "../../core/models/types";
import { activeShapeStore } from "../../store/activeShape";
import { getShape } from "../id";
import { accessState } from "../systems/access/state";
import { auraSystem } from "../systems/auras";
import type { Aura, AuraId } from "../systems/auras/models";
import { noteState } from "../systems/notes/state";
import { NoteManagerMode } from "../systems/notes/types";
import { openNoteManager } from "../systems/notes/ui";
import { propertiesSystem } from "../systems/properties";
import { getProperties, propertiesState } from "../systems/properties/state";
import { selectedState } from "../systems/selected/state";
import { trackerSystem } from "../systems/trackers";
import type { Tracker, TrackerId } from "../systems/trackers/models";

import TrackerInput from "./TrackerInput.vue";

const { t } = useI18n();

const activeTracker = ref<Tracker | Aura | null>(null);

const trackers = computed(() => [...trackerSystem.state.parentTrackers, ...trackerSystem.state.trackers.slice(0, -1)]);

const auras = computed(() => [...auraSystem.state.parentAuras, ...auraSystem.state.auras.slice(0, -1)]);

const notes = computed(
    () =>
        noteState.reactive.shapeNotes
            .get(selectedState.reactive.focus!)
            ?.map((note) => noteState.reactive.notes.get(note)!) ?? [],
);

function setLocked(): void {
    const shapeId = selectedState.raw.focus;
    if (accessState.hasEditAccess.value && shapeId !== undefined) {
        propertiesSystem.setLocked(shapeId, !getProperties(shapeId)!.isLocked, SERVER_SYNC);
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

function openNotes(): void {
    const shapeId = selectedState.raw.focus;
    if (shapeId === undefined) return;

    openNoteManager(NoteManagerMode.List, shapeId);
}
</script>

<template>
    <div>
        <TrackerInput :tracker="activeTracker" @submit="setValue" @close="activeTracker = null" />
        <template v-if="selectedState.reactive.focus !== undefined">
            <div id="selection-menu">
                <div>
                    <div
                        id="selection-lock-button"
                        :title="t('game.ui.selection.SelectionInfo.lock')"
                        @click="setLocked"
                    >
                        <font-awesome-icon v-if="propertiesState.reactive.isLocked" icon="lock" />
                        <font-awesome-icon v-else icon="unlock" />
                    </div>
                    <div
                        id="selection-edit-button"
                        :title="t('game.ui.selection.SelectionInfo.open_shape_props')"
                        @click="openEditDialog"
                    >
                        <font-awesome-icon icon="edit" />
                    </div>
                    <div id="selection-name">{{ propertiesState.reactive.name }}</div>
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
                                class="selection-tracker-value"
                                :title="t('game.ui.selection.SelectionInfo.quick_edit_aura')"
                                @click="changeValue(aura)"
                            >
                                <template v-if="aura.dim === 0">
                                    {{ aura.value }}
                                </template>
                                <template v-else>{{ aura.value }} / {{ aura.dim }}</template>
                            </div>
                        </template>
                    </div>
                </div>
                <div class="info-notes">
                    <font-awesome-icon icon="note-sticky" title="Open note manager" @click="openNotes" />
                    {{ notes.length }} {{ `note${notes.length !== 1 ? "s" : ""}` }}
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

            .selection-tracker-value {
                justify-self: center;
                padding: 2px;

                &:hover {
                    cursor: pointer;
                    background-color: rgba(20, 20, 20, 0.2);
                }
            }

            &.noAccess .selection-tracker-value:hover {
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
        align-items: center;

        svg {
            margin: 0 0.5rem;
        }
    }
}
</style>
