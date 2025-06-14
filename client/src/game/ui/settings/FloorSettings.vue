<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import ColourPicker from "../../../core/components/ColourPicker.vue";
import Modal from "../../../core/components/modals/Modal.vue";
import { useModal } from "../../../core/plugins/modals/plugin";
import {
    BackgroundType,
    FloorType,
    getBackgroundTypeFromString,
    getBackgroundTypes,
    getFloorTypes,
} from "../../models/floor";
import { floorSystem } from "../../systems/floors";
import { floorState } from "../../systems/floors/state";
import { locationSettingsState } from "../../systems/settings/location/state";
import { uiSystem } from "../../systems/ui";
import { uiState } from "../../systems/ui/state";

import PatternSettings from "./floor/PatternSettings.vue";

const { t } = useI18n();
const modals = useModal();

function close(): void {
    uiSystem.hideFloorSettings();
}

defineExpose({ close });

const floor = computed(() => floorSystem.getFloor({ id: uiState.reactive.selectedFloor }));

const floorTypes = getFloorTypes();

function updateName(event: Event): void {
    const name = (event.target as HTMLInputElement).value;
    if (floorSystem.getFloor({ name }) !== undefined) return;

    floorSystem.renameFloor(uiState.reactive.selectedFloor, name, true);
}

function setFloorType(event: Event): void {
    if (floor.value === undefined) return;

    const type = Number.parseInt((event.target as HTMLSelectElement).value);
    floorSystem.setFloorType({ id: floor.value.id }, type, true);
}

async function removeFloor(): Promise<void> {
    if (floor.value === undefined || floorState.raw.floors.length <= 1) return;

    const doRemove = await modals.confirm(
        t("common.warning"),
        t("game.ui.FloorSelect.warning_msg_Z", { z: floor.value.name }),
    );
    if (doRemove === true) {
        floorSystem.removeFloor(floor.value, true);
        close();
    }
}

// Background

const backgroundTypes = getBackgroundTypes();

const defaultBackground = computed(() => {
    if (floor.value?.type === FloorType.Air) {
        return locationSettingsState.reactive.airMapBackground.value;
    } else if (floor.value?.type === FloorType.Ground) {
        return locationSettingsState.reactive.groundMapBackground.value;
    } else {
        return locationSettingsState.reactive.undergroundMapBackground.value;
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
    floorSystem.setFloorBackground({ id: floor.value.id }, value, true);
}

function setBackground(background: string): void {
    if (floor.value === undefined) return;
    floorSystem.setFloorBackground({ id: floor.value.id }, background, true);
}

function resetBackground(): void {
    if (floor.value === undefined) return;
    floorSystem.setFloorBackground({ id: floor.value.id }, undefined, true);
}

function setPatternData(data: string): void {
    if (floor.value === undefined) return;
    floorSystem.setFloorBackground({ id: floor.value.id }, data, true);
}
</script>

<template>
    <Modal :visible="uiState.reactive.showFloorSettings" :mask="false" @close="close">
        <template #header="m">
            <div class="modal-header" draggable="true" @dragstart="m.dragStart" @dragend="m.dragEnd">
                <div>{{ t("game.ui.settings.floor.title") }}</div>
                <div class="header-close" :title="t('common.close')" @click="close">
                    <font-awesome-icon :icon="['far', 'window-close']" />
                </div>
            </div>
        </template>
        <div class="modal-body">
            <label>{{ t("common.name") }}</label>
            <input type="text" :value="floor?.name" @change="updateName" />
            <div></div>

            <label>{{ t("common.type") }}</label>
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
                <label>{{ t("common.background") }}</label>
                <select :value="backgroundType" @change="setBackgroundType">
                    <option v-for="[i, type] of backgroundTypes.entries()" :key="'background-' + i" :value="i">
                        {{ type }}
                    </option>
                </select>

                <div
                    v-if="floor?.backgroundValue !== undefined && defaultBackground !== floor?.backgroundValue"
                    :title="t('game.ui.settings.common.reset_default')"
                    @click="resetBackground"
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
                <PatternSettings
                    :pattern="floor?.backgroundValue ?? defaultBackground ?? ''"
                    @update:pattern="setPatternData"
                />
            </template>

            <div></div>
            <button @click="removeFloor">{{ t("common.remove") }}</button>
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
</style>
