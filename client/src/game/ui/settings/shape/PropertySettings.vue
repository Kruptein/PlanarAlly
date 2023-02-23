<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import ColourPicker from "../../../../core/components/ColourPicker.vue";
import { NO_SYNC, SERVER_SYNC, SyncMode } from "../../../../core/models/types";
import { useModal } from "../../../../core/plugins/modals/plugin";
import { activeShapeStore } from "../../../../store/activeShape";
import { getShape } from "../../../id";
import type { IText } from "../../../interfaces/shapes/text";
import type { Asset } from "../../../shapes/variants/asset";
import type { CircularToken } from "../../../shapes/variants/circularToken";
import { accessState } from "../../../systems/access/state";
import { propertiesSystem } from "../../../systems/properties";
import { getProperties, propertiesState } from "../../../systems/properties/state";

const { t } = useI18n();
const modals = useModal();

const owned = accessState.hasEditAccess;
const isAsset = computed(() => activeShapeStore.state.type === "assetrect");

function updateName(event: Event): void {
    if (!owned.value) return;
    propertiesSystem.setName(propertiesState.raw.id!, (event.target as HTMLInputElement).value, SERVER_SYNC);
}

function toggleNameVisible(): void {
    if (!owned.value) return;
    const id = propertiesState.raw.id!;
    propertiesSystem.setNameVisible(id, !getProperties(id)!.nameVisible, SERVER_SYNC);
}

function setToken(event: Event): void {
    if (!owned.value) return;
    propertiesSystem.setIsToken(propertiesState.raw.id!, (event.target as HTMLInputElement).checked, SERVER_SYNC);
}

function setInvisible(event: Event): void {
    if (!owned.value) return;
    propertiesSystem.setIsInvisible(propertiesState.raw.id!, (event.target as HTMLInputElement).checked, SERVER_SYNC);
}

function setDefeated(event: Event): void {
    if (!owned.value) return;
    propertiesSystem.setIsDefeated(propertiesState.raw.id!, (event.target as HTMLInputElement).checked, SERVER_SYNC);
}

function setLocked(event: Event): void {
    if (!owned.value) return;
    propertiesSystem.setLocked(propertiesState.raw.id!, (event.target as HTMLInputElement).checked, SERVER_SYNC);
}

function toggleBadge(event: Event): void {
    if (!owned.value) return;
    propertiesSystem.setShowBadge(propertiesState.raw.id!, (event.target as HTMLInputElement).checked, SERVER_SYNC);
}

function setBlocksVision(event: Event): void {
    if (!owned.value) return;
    propertiesSystem.setBlocksVision(propertiesState.raw.id!, (event.target as HTMLInputElement).checked, SERVER_SYNC);
}

function setBlocksMovement(event: Event): void {
    if (!owned.value) return;
    propertiesSystem.setBlocksMovement(
        propertiesState.raw.id!,
        (event.target as HTMLInputElement).checked,
        SERVER_SYNC,
    );
}

function setStrokeColour(event: string, temporary = false): void {
    if (!owned.value) return;
    propertiesSystem.setStrokeColour(propertiesState.raw.id!, event, temporary ? NO_SYNC : SERVER_SYNC);
}

function setFillColour(colour: string, temporary = false): void {
    if (!owned.value) return;
    propertiesSystem.setFillColour(propertiesState.raw.id!, colour, temporary ? NO_SYNC : SERVER_SYNC);
}

const hasValue = computed(() => {
    if (activeShapeStore.state.type === undefined) return false;
    return ["circulartoken", "text"].includes(activeShapeStore.state.type);
});

function getValue(): string {
    if (activeShapeStore.state.id !== undefined) {
        if (activeShapeStore.state.type === "circulartoken") {
            return (getShape(activeShapeStore.state.id) as CircularToken).text;
        } else if (activeShapeStore.state.type === "text") {
            return (getShape(activeShapeStore.state.id) as IText).text;
        }
    }
    return "";
}

function setValue(event: Event): void {
    if (!owned.value) return;
    if (activeShapeStore.state.id !== undefined) {
        const shape = getShape(activeShapeStore.state.id);
        if (activeShapeStore.state.type === "circulartoken") {
            (shape as CircularToken).setText((event.target as HTMLInputElement).value, SyncMode.FULL_SYNC);
        } else if (activeShapeStore.state.type === "text") {
            (shape as IText).setText((event.target as HTMLInputElement).value, SyncMode.FULL_SYNC);
        }
        shape?.invalidate(true);
    }
}

async function changeAsset(): Promise<void> {
    if (!owned.value) return;
    if (activeShapeStore.state.id === undefined) return;
    const data = await modals.assetPicker();
    if (data === undefined || data.file_hash === undefined) return;
    const shape = getShape(activeShapeStore.state.id);
    if (shape === undefined || shape.type !== "assetrect") return;
    (shape as Asset).setImage(`/static/assets/${data.file_hash}`, true);
}
</script>

<template>
    <div class="panel restore-panel">
        <div class="spanrow header">Common</div>
        <div class="row">
            <label for="shapeselectiondialog-name">{{ t("common.name") }}</label>
            <input
                id="shapeselectiondialog-name"
                type="text"
                :value="propertiesState.reactive.name"
                :disabled="!owned"
                @change="updateName"
            />
            <div
                :style="{ opacity: propertiesState.reactive.nameVisible ? 1.0 : 0.3, textAlign: 'center' }"
                :disabled="!owned"
                :title="t('common.toggle_public_private')"
                @click="toggleNameVisible"
            >
                <font-awesome-icon icon="eye" />
            </div>
        </div>
        <div v-if="hasValue" class="row">
            <label for="shapeselectiondialog-value">{{ t("common.value") }}</label>
            <input
                id="shapeselectiondialog-value"
                type="text"
                :value="getValue()"
                :disabled="!owned"
                @change="setValue"
            />
            <div></div>
        </div>
        <div class="row">
            <label for="shapeselectiondialog-istoken">{{ t("game.ui.selection.edit_dialog.dialog.is_a_token") }}</label>
            <input
                id="shapeselectiondialog-istoken"
                type="checkbox"
                :checked="propertiesState.reactive.isToken"
                style="grid-column-start: toggle"
                class="styled-checkbox"
                :disabled="!owned"
                @click="setToken"
            />
        </div>
        <div class="row">
            <label for="shapeselectiondialog-is-invisible">
                {{ t("game.ui.selection.edit_dialog.dialog.is_invisible") }}
            </label>
            <input
                id="shapeselectiondialog-is-invisible"
                type="checkbox"
                :checked="propertiesState.reactive.isInvisible"
                style="grid-column-start: toggle"
                class="styled-checkbox"
                :disabled="!owned"
                @click="setInvisible"
            />
        </div>
        <div class="row">
            <label for="shapeselectiondialog-is-defeated">
                {{ t("game.ui.selection.edit_dialog.dialog.is_defeated") }}
            </label>
            <input
                id="shapeselectiondialog-is-defeated"
                type="checkbox"
                :checked="propertiesState.reactive.isDefeated"
                style="grid-column-start: toggle"
                class="styled-checkbox"
                :disabled="!owned"
                @click="setDefeated"
            />
        </div>
        <div class="row">
            <label for="shapeselectiondialog-strokecolour">{{ t("common.border_color") }}</label>
            <ColourPicker
                :colour="propertiesState.reactive.strokeColour?.[0]"
                style="grid-column-start: toggle"
                :disabled="!owned"
                @input:colour="setStrokeColour($event, true)"
                @update:colour="setStrokeColour($event)"
            />
        </div>
        <div class="row">
            <label for="shapeselectiondialog-fillcolour">{{ t("common.fill_color") }}</label>
            <ColourPicker
                :colour="propertiesState.reactive.fillColour"
                style="grid-column-start: toggle"
                :disabled="!owned"
                @input:colour="setFillColour($event, true)"
                @update:colour="setFillColour($event)"
            />
        </div>
        <div v-if="isAsset" class="row">
            <label></label>
            <button @click="changeAsset">Change asset</button>
        </div>
        <div class="spanrow header">Advanced</div>
        <div class="row">
            <label for="shapeselectiondialog-visionblocker">
                {{ t("game.ui.selection.edit_dialog.dialog.block_vision_light") }}
            </label>
            <input
                id="shapeselectiondialog-visionblocker"
                type="checkbox"
                :checked="propertiesState.reactive.blocksVision"
                style="grid-column-start: toggle"
                :disabled="!owned"
                @click="setBlocksVision"
            />
        </div>
        <div class="row">
            <label for="shapeselectiondialog-moveblocker">
                {{ t("game.ui.selection.edit_dialog.dialog.block_movement") }}
            </label>
            <input
                id="shapeselectiondialog-moveblocker"
                type="checkbox"
                :checked="propertiesState.reactive.blocksMovement"
                style="grid-column-start: toggle"
                :disabled="!owned"
                @click="setBlocksMovement"
            />
        </div>
        <div class="row">
            <label for="shapeselectiondialog-is-locked">
                {{ t("game.ui.selection.edit_dialog.dialog.is_locked") }}
            </label>
            <input
                id="shapeselectiondialog-is-locked"
                type="checkbox"
                :checked="propertiesState.reactive.isLocked"
                style="grid-column-start: toggle"
                class="styled-checkbox"
                :disabled="!owned"
                @click="setLocked"
            />
        </div>
        <div class="row">
            <label for="shapeselectiondialog-showBadge">
                {{ t("game.ui.selection.edit_dialog.dialog.show_badge") }}
            </label>
            <input
                id="shapeselectiondialog-showBadge"
                type="checkbox"
                :checked="propertiesState.reactive.showBadge"
                style="grid-column-start: toggle"
                class="styled-checkbox"
                :disabled="!owned"
                @click="toggleBadge"
            />
        </div>
    </div>
</template>

<style scoped>
.panel {
    grid-template-columns: [label] 1fr [name] 2fr [toggle] 30px [end];
    grid-column-gap: 5px;
    align-items: center;
    padding-bottom: 1em;
    justify-items: center;
}

label {
    justify-self: normal;
}

/* Reset PanelModal 100% style */
input[type="text"] {
    width: auto;
}

input[type="checkbox"] {
    width: 16px;
    height: 23px;
    margin: 0 8px 0 8px;
    white-space: nowrap;
    display: inline-block;
}

button {
    grid-column: 2/4;
    justify-self: flex-end;
}
</style>
