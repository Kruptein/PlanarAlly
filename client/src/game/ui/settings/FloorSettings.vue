<script setup lang="ts">
import { computed, toRef } from "@vue/runtime-core";
import { useI18n } from "vue-i18n";

import ColourPicker from "../../../core/components/ColourPicker.vue";
import Modal from "../../../core/components/modals/Modal.vue";
import { useModal } from "../../../core/plugins/modals/plugin";
import { baseAdjust, getValue } from "../../../core/utils";
import { floorStore } from "../../../store/floor";
import { settingsStore } from "../../../store/settings";
import { uiStore } from "../../../store/ui";
import { getPattern, patternToString } from "../../layers/floor";
import {
    BackgroundType,
    FloorType,
    getBackgroundTypeFromString,
    getBackgroundTypes,
    getFloorTypes,
} from "../../models/floor";

const { t } = useI18n();
const modals = useModal();

const visible = toRef(uiStore.state, "showFloorSettings");
const close = uiStore.hideFloorSettings.bind(uiStore);

const floor = computed(() => floorStore.getFloor({ id: uiStore.state.selectedFloor }));

const floorTypes = getFloorTypes();

function updateName(event: Event): void {
    const name = (event.target as HTMLInputElement).value;
    if (floorStore.getFloor({ name }) !== undefined) return;

    floorStore.renameFloor(uiStore.state.selectedFloor, name, true);
}

function setFloorType(event: Event): void {
    if (floor.value === undefined) return;

    const type = Number.parseInt((event.target as HTMLSelectElement).value);
    floorStore.setFloorType({ id: floor.value.id }, type, true);
}

async function removeFloor(): Promise<void> {
    if (floor.value === undefined || floorStore.state.floors.length <= 1) return;

    const doRemove = await modals.confirm(
        t("common.warning"),
        t("game.ui.FloorSelect.warning_msg_Z", { z: floor.value.name }),
    );
    if (doRemove === true) {
        floorStore.removeFloor(floor.value, true);
        close();
    }
}

// Background

const backgroundTypes = getBackgroundTypes();

const defaultBackground = computed(() => {
    if (floor.value?.type === FloorType.Air) {
        return settingsStore.airMapBackground.value;
    } else if (floor.value?.type === FloorType.Ground) {
        return settingsStore.groundMapBackground.value;
    } else {
        return settingsStore.undergroundMapBackground.value;
    }
});

const backgroundType = computed(() =>
    getBackgroundTypeFromString(floor.value?.backgroundValue ?? defaultBackground.value),
);

function setBackgroundType(event: Event): void {
    if (floor.value === undefined) return;

    const type = Number.parseInt((event.target as HTMLSelectElement).value);
    let value: string | undefined;
    if (type === 1) {
        value = "rgba(255, 255, 255, 1)";
    } else if (type === 2) {
        value = "pattern:empty";
    } else {
        value = "none";
    }
    floorStore.setFloorBackground({ id: floor.value.id }, value, true);
}

function setBackground(background: string): void {
    if (floor.value === undefined) return;
    floorStore.setFloorBackground({ id: floor.value.id }, background, true);
}

function resetBackground(): void {
    if (floor.value === undefined) return;
    floorStore.setFloorBackground({ id: floor.value.id }, undefined, true);
}

async function setPattern(): Promise<void> {
    if (floor.value === undefined) return;

    const data = await modals.assetPicker();
    if (data === undefined || data.file_hash === undefined) return;

    floorStore.setFloorBackground({ id: floor.value.id }, `pattern(${data.file_hash},0,0,1,1)`, true);
}

const backgroundPattern = computed(() => {
    const background = floor.value?.backgroundValue ?? defaultBackground.value;
    const defaultPattern = {
        hash: "",
        offsetX: 0,
        offsetY: 0,
        scaleX: 0,
        scaleY: 0,
    };
    if (background === null) return defaultPattern;

    return getPattern(background) ?? defaultPattern;
});

function setPatternData(data: { offsetX?: Event; offsetY?: Event; scaleX?: Event; scaleY?: Event }): void {
    if (floor.value === undefined) return;

    const pattern = backgroundPattern.value;
    const offsetX = data.offsetX ? Number.parseInt(getValue(data.offsetX)) : pattern.offsetX;
    const offsetY = data.offsetY ? Number.parseInt(getValue(data.offsetY)) : pattern.offsetY;
    const scaleX = data.scaleX ? Number.parseInt(getValue(data.scaleX)) / 100 : pattern.scaleX;
    const scaleY = data.scaleY ? Number.parseInt(getValue(data.scaleY)) / 100 : pattern.scaleY;

    const newPattern = { ...pattern, offsetX, offsetY, scaleX, scaleY };

    floorStore.setFloorBackground({ id: floor.value.id }, patternToString(newPattern), true);
}
</script>

<template>
    <Modal :visible="visible" :mask="false" @close="close">
        <template v-slot:header="m">
            <div class="modal-header" draggable="true" @dragstart="m.dragStart" @dragend="m.dragEnd">
                <div>{{ t("game.ui.settings.floor.title") }}</div>
                <div class="header-close" @click="close" :title="t('common.close')">
                    <font-awesome-icon :icon="['far', 'window-close']" />
                </div>
            </div>
        </template>
        <div class="modal-body">
            <label>Name</label>
            <input type="text" :value="floor?.name" @change="updateName" />
            <div></div>

            <label>Type</label>
            <select :value="floor?.type" @change="setFloorType">
                <option v-for="[i, type] of floorTypes.entries()" :key="'floor-' + i" :value="i">
                    {{ type }}
                </option>
            </select>
            <div></div>

            <div
                class="row"
                :class="{
                    overwritten: floor?.backgroundValue !== undefined && defaultBackground !== floor?.backgroundValue,
                }"
            >
                <label>Background</label>
                <select :value="backgroundType" @change="setBackgroundType">
                    <option v-for="[i, type] of backgroundTypes.entries()" :key="'background-' + i" :value="i">
                        {{ type }}
                    </option>
                </select>

                <div
                    @click="resetBackground"
                    :title="t('game.ui.settings.common.reset_default')"
                    v-if="floor?.backgroundValue !== undefined && defaultBackground !== floor?.backgroundValue"
                >
                    <font-awesome-icon icon="times-circle" />
                </div>
                <div v-else></div>
            </div>

            <template v-if="backgroundType === BackgroundType.Simple">
                <div></div>
                <div>
                    <ColourPicker
                        :colour="floor?.backgroundValue ?? defaultBackground ?? undefined"
                        @update:colour="setBackground($event)"
                    />
                </div>
                <div></div>
            </template>

            <template v-if="backgroundType === BackgroundType.Pattern">
                <div>Pattern</div>
                <div>
                    <img
                        alt="Pattern image preview"
                        :src="baseAdjust('/static/assets/' + backgroundPattern.hash)"
                        class="pattern-preview"
                    />
                    <font-awesome-icon id="set-pattern" icon="plus-square" title="Set a pattern" @click="setPattern" />
                </div>
                <div></div>

                <div>Offset</div>
                <div>
                    <input
                        type="number"
                        :value="backgroundPattern.offsetX"
                        @change="setPatternData({ offsetX: $event })"
                    />
                    <input
                        type="number"
                        :value="backgroundPattern.offsetY"
                        @change="setPatternData({ offsetY: $event })"
                    />
                </div>
                <div></div>

                <div>Scale</div>
                <div>
                    <input
                        type="number"
                        min="1"
                        :value="100 * backgroundPattern.scaleX"
                        @change="setPatternData({ scaleX: $event })"
                    />
                    <input
                        type="number"
                        min="1"
                        :value="100 * backgroundPattern.scaleY"
                        @change="setPatternData({ scaleY: $event })"
                    />
                </div>
                <div></div>
            </template>

            <div></div>
            <button @click="removeFloor">Remove</button>
        </div>
    </Modal>
</template>

<style lang="scss" scoped>
.modal-header {
    color: white;
    background-color: #7c253e;
    padding: 10px;
    font-size: 20px;
    font-weight: bold;
    cursor: move;
}

.header-close {
    position: absolute;
    top: 5px;
    right: 5px;
}

.modal-body {
    max-height: 50vh;
    max-width: 35vw;

    padding: 1em;
    display: grid;
    grid-template-columns: [setting] 1fr [value] auto [restore] 30px [end];
    gap: 0.5em;
    align-content: start;
}

.row {
    display: contents;
}

.overwritten,
.modal-body .row.overwritten * {
    color: #7c253e;
    font-weight: bold;
}

.pattern-preview {
    max-width: 100px;
    max-height: 100px;
}
</style>
