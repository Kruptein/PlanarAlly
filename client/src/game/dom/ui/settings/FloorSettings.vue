<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import ColourPicker from "../../../../core/components/ColourPicker.vue";
import Modal from "../../../../core/components/modals/Modal.vue";
import { useModal } from "../../../../core/plugins/modals/plugin";
import {
    BackgroundType,
    FloorIndex,
    FloorType,
    getBackgroundTypeFromString,
    getBackgroundTypes,
    getFloorTypes,
} from "../../../core/models/floor";
// import { floorSystem } from "../../../core/systems/floors";
// import { floorState } from "../../../core/systems/floors/state";
// import { locationSettingsState } from "../../../core/systems/settings/location/state";
import { uiSystem } from "../../../core/systems/ui";
import { uiState } from "../../../core/systems/ui/state";
import { postRender } from "../../../messages/render";
import { uiFloorState } from "../../state/floor";

import PatternSettings from "./floor/PatternSettings.vue";

const { t } = useI18n();
const modals = useModal();

function close(): void {
    uiSystem.hideFloorSettings();
}

defineExpose({ close });

const floorIndex = computed(
    () => uiFloorState.reactive.floors.findIndex((f) => f.id === uiState.reactive.selectedFloor) as FloorIndex,
);
const floor = computed(() =>
    floorIndex.value >= 0 ? uiFloorState.mutableReactive.floors[floorIndex.value] : undefined,
);

const floorTypes = getFloorTypes();

async function updateName(event: Event): Promise<void> {
    if (floor.value === undefined) return;
    const name = (event.target as HTMLInputElement).value;
    if (uiFloorState.raw.floors.some((f) => f.name === name)) return;
    await postRender("Floor.Rename", { index: floorIndex.value, name });
    floor.value.name = name;
}

async function setFloorType(event: Event): Promise<void> {
    if (floor.value === undefined) return;
    const type = Number.parseInt((event.target as HTMLSelectElement).value);
    await postRender("Floor.Type.Set", { index: floorIndex.value, type });
    floor.value.type = type;
}

async function removeFloor(): Promise<void> {
    if (floor.value === undefined || uiFloorState.raw.floors.length <= 1) return;
    const doRemove = await modals.confirm(
        t("common.warning"),
        t("game.ui.FloorSelect.warning_msg_Z", { z: floor.value.name }),
    );
    if (doRemove === true) {
        //     floorSystem.removeFloor(floor.value, true);
        close();
    }
}

// Background

const backgroundTypes = getBackgroundTypes();

const defaultBackground = computed(() => {
    return "none";
    // if (floor.value?.type === FloorType.Air) {
    //     return locationSettingsState.reactive.airMapBackground.value;
    // } else if (floor.value?.type === FloorType.Ground) {
    //     return locationSettingsState.reactive.groundMapBackground.value;
    // } else {
    //     return locationSettingsState.reactive.undergroundMapBackground.value;
    // }
});

const backgroundType = computed(() =>
    getBackgroundTypeFromString(floor.value?.backgroundValue ?? defaultBackground.value),
);

async function setBackgroundType(event: Event): Promise<void> {
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
    await setBackground(value);
}

async function setBackground(background: string | undefined): Promise<void> {
    if (floor.value === undefined) return;
    await postRender("Floor.Background.Set", { id: floor.value.id, background });
    floor.value.backgroundValue = background;
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
                    v-if="floor?.backgroundValue !== undefined && defaultBackground !== floor?.backgroundValue"
                    :title="t('game.ui.settings.common.reset_default')"
                    @click="setBackground(undefined)"
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
                    @update:pattern="setBackground"
                />
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
</style>
