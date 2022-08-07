<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import ColourPicker from "../../../../core/components/ColourPicker.vue";
import { NO_SYNC, SERVER_SYNC, SyncMode } from "../../../../core/models/types";
import { activeShapeStore } from "../../../../store/activeShape";
import { getShape } from "../../../id";
import type { IText } from "../../../interfaces/shapes/text";
import type { CircularToken } from "../../../shapes/variants/circularToken";
import { accessState } from "../../../systems/access/state";
import { propertiesSystem } from "../../../systems/properties";
import { getProperties, propertiesState } from "../../../systems/properties/state";

const { t } = useI18n();

const owned = accessState.hasEditAccess;

function updateName(event: Event): void {
    if (!owned.value) return;
    propertiesSystem.setName(propertiesState.reactive.id!, (event.target as HTMLInputElement).value, SERVER_SYNC);
}

function toggleNameVisible(): void {
    if (!owned.value) return;
    const id = propertiesState.reactive.id!;
    propertiesSystem.setNameVisible(id, !getProperties(id)!.nameVisible, SERVER_SYNC);
}

function setToken(event: Event): void {
    if (!owned.value) return;
    propertiesSystem.setIsToken(propertiesState.reactive.id!, (event.target as HTMLInputElement).checked, SERVER_SYNC);
}

function setInvisible(event: Event): void {
    if (!owned.value) return;
    propertiesSystem.setIsInvisible(
        propertiesState.reactive.id!,
        (event.target as HTMLInputElement).checked,
        SERVER_SYNC,
    );
}

function setDefeated(event: Event): void {
    if (!owned.value) return;
    propertiesSystem.setIsDefeated(
        propertiesState.reactive.id!,
        (event.target as HTMLInputElement).checked,
        SERVER_SYNC,
    );
}

function setLocked(event: Event): void {
    if (!owned.value) return;
    propertiesSystem.setLocked(propertiesState.reactive.id!, (event.target as HTMLInputElement).checked, SERVER_SYNC);
}

function toggleBadge(event: Event): void {
    if (!owned.value) return;
    propertiesSystem.setShowBadge(
        propertiesState.reactive.id!,
        (event.target as HTMLInputElement).checked,
        SERVER_SYNC,
    );
}

function setBlocksVision(event: Event): void {
    if (!owned.value) return;
    propertiesSystem.setBlocksVision(
        propertiesState.reactive.id!,
        (event.target as HTMLInputElement).checked,
        SERVER_SYNC,
    );
}

function setBlocksMovement(event: Event): void {
    if (!owned.value) return;
    propertiesSystem.setBlocksMovement(
        propertiesState.reactive.id!,
        (event.target as HTMLInputElement).checked,
        SERVER_SYNC,
    );
}

function setStrokeColour(event: string, temporary = false): void {
    if (!owned.value) return;
    propertiesSystem.setStrokeColour(propertiesState.reactive.id!, event, temporary ? NO_SYNC : SERVER_SYNC);
}

function setFillColour(colour: string, temporary = false): void {
    if (!owned.value) return;
    propertiesSystem.setFillColour(propertiesState.reactive.id!, colour, temporary ? NO_SYNC : SERVER_SYNC);
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
</script>

<template>
    <div class="panel restore-panel">
        <div class="spanrow header">Common</div>
        <div class="row">
            <label for="shapeselectiondialog-name">{{ t("common.name") }}</label>
            <input
                type="text"
                id="shapeselectiondialog-name"
                :value="propertiesState.reactive.name"
                @change="updateName"
                :disabled="!owned"
            />
            <div
                :style="{ opacity: propertiesState.reactive.nameVisible ? 1.0 : 0.3, textAlign: 'center' }"
                @click="toggleNameVisible"
                :disabled="!owned"
                :title="t('common.toggle_public_private')"
            >
                <font-awesome-icon icon="eye" />
            </div>
        </div>
        <div class="row" v-if="hasValue">
            <label for="shapeselectiondialog-value">{{ t("common.value") }}</label>
            <input
                type="text"
                id="shapeselectiondialog-value"
                :value="getValue()"
                @change="setValue"
                :disabled="!owned"
            />
            <div></div>
        </div>
        <div class="row">
            <label for="shapeselectiondialog-istoken">{{ t("game.ui.selection.edit_dialog.dialog.is_a_token") }}</label>
            <input
                type="checkbox"
                id="shapeselectiondialog-istoken"
                :checked="propertiesState.reactive.isToken"
                @click="setToken"
                style="grid-column-start: toggle"
                class="styled-checkbox"
                :disabled="!owned"
            />
        </div>
        <div class="row">
            <label for="shapeselectiondialog-is-invisible">
                {{ t("game.ui.selection.edit_dialog.dialog.is_invisible") }}
            </label>
            <input
                type="checkbox"
                id="shapeselectiondialog-is-invisible"
                :checked="propertiesState.reactive.isInvisible"
                @click="setInvisible"
                style="grid-column-start: toggle"
                class="styled-checkbox"
                :disabled="!owned"
            />
        </div>
        <div class="row">
            <label for="shapeselectiondialog-is-defeated">
                {{ t("game.ui.selection.edit_dialog.dialog.is_defeated") }}
            </label>
            <input
                type="checkbox"
                id="shapeselectiondialog-is-defeated"
                :checked="propertiesState.reactive.isDefeated"
                @click="setDefeated"
                style="grid-column-start: toggle"
                class="styled-checkbox"
                :disabled="!owned"
            />
        </div>
        <div class="row">
            <label for="shapeselectiondialog-strokecolour">{{ t("common.border_color") }}</label>
            <ColourPicker
                :colour="propertiesState.reactive.strokeColour?.[0]"
                @input:colour="setStrokeColour($event, true)"
                @update:colour="setStrokeColour($event)"
                style="grid-column-start: toggle"
                :disabled="!owned"
            />
        </div>
        <div class="row">
            <label for="shapeselectiondialog-fillcolour">{{ t("common.fill_color") }}</label>
            <ColourPicker
                :colour="propertiesState.reactive.fillColour"
                @input:colour="setFillColour($event, true)"
                @update:colour="setFillColour($event)"
                style="grid-column-start: toggle"
                :disabled="!owned"
            />
        </div>
        <div class="spanrow header">Advanced</div>
        <div class="row">
            <label for="shapeselectiondialog-visionblocker">
                {{ t("game.ui.selection.edit_dialog.dialog.block_vision_light") }}
            </label>
            <input
                type="checkbox"
                id="shapeselectiondialog-visionblocker"
                :checked="propertiesState.reactive.blocksVision"
                @click="setBlocksVision"
                style="grid-column-start: toggle"
                :disabled="!owned"
            />
        </div>
        <div class="row">
            <label for="shapeselectiondialog-moveblocker">
                {{ t("game.ui.selection.edit_dialog.dialog.block_movement") }}
            </label>
            <input
                type="checkbox"
                id="shapeselectiondialog-moveblocker"
                :checked="propertiesState.reactive.blocksMovement"
                @click="setBlocksMovement"
                style="grid-column-start: toggle"
                :disabled="!owned"
            />
        </div>
        <div class="row">
            <label for="shapeselectiondialog-is-locked">
                {{ t("game.ui.selection.edit_dialog.dialog.is_locked") }}
            </label>
            <input
                type="checkbox"
                id="shapeselectiondialog-is-locked"
                :checked="propertiesState.reactive.isLocked"
                @click="setLocked"
                style="grid-column-start: toggle"
                class="styled-checkbox"
                :disabled="!owned"
            />
        </div>
        <div class="row">
            <label for="shapeselectiondialog-showBadge">
                {{ t("game.ui.selection.edit_dialog.dialog.show_badge") }}
            </label>
            <input
                type="checkbox"
                id="shapeselectiondialog-showBadge"
                :checked="propertiesState.reactive.showBadge"
                @click="toggleBadge"
                style="grid-column-start: toggle"
                class="styled-checkbox"
                :disabled="!owned"
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
</style>
