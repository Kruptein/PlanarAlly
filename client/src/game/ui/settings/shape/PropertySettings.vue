<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import { assetState } from "../../../../assets/state";
import { getImageSrcFromHash } from "../../../../assets/utils";
import ColourPicker from "../../../../core/components/ColourPicker.vue";
import ToggleGroup from "../../../../core/components/ToggleGroup.vue";
import { NO_SYNC, SERVER_SYNC, SyncMode } from "../../../../core/models/types";
import { activeShapeStore } from "../../../../store/activeShape";
import { getColour } from "../../../colour";
import { getShape } from "../../../id";
import type { IText } from "../../../interfaces/shapes/text";
import type { Asset } from "../../../shapes/variants/asset";
import type { CircularToken } from "../../../shapes/variants/circularToken";
import { accessState } from "../../../systems/access/state";
import { pickAsset } from "../../../systems/assets/ui";
import { propertiesSystem } from "../../../systems/properties";
import { useShapeProps } from "../../../systems/properties/composables";
import { VisionBlock, visionBlocks } from "../../../systems/properties/types";
import { selectedState } from "../../../systems/selected/state";

const { t } = useI18n();
const shapeProps = useShapeProps();

const owned = accessState.hasEditAccess;
const isAsset = computed(() => activeShapeStore.state.type === "assetrect");

function updateName(event: Event): void {
    if (!owned.value) return;
    propertiesSystem.setName(selectedState.raw.focus!, (event.target as HTMLInputElement).value, SERVER_SYNC);
}

function toggleNameVisible(): void {
    if (!owned.value) return;
    const id = selectedState.raw.focus!;
    propertiesSystem.setNameVisible(id, !shapeProps.value!.nameVisible, SERVER_SYNC);
}

function setToken(event: Event): void {
    if (!owned.value) return;
    propertiesSystem.setIsToken(selectedState.raw.focus!, (event.target as HTMLInputElement).checked, SERVER_SYNC);
}

function setInvisible(event: Event): void {
    if (!owned.value) return;
    propertiesSystem.setIsInvisible(selectedState.raw.focus!, (event.target as HTMLInputElement).checked, SERVER_SYNC);
}

function setDefeated(event: Event): void {
    if (!owned.value) return;
    propertiesSystem.setIsDefeated(selectedState.raw.focus!, (event.target as HTMLInputElement).checked, SERVER_SYNC);
}

function setLocked(event: Event): void {
    if (!owned.value) return;
    propertiesSystem.setLocked(selectedState.raw.focus!, (event.target as HTMLInputElement).checked, SERVER_SYNC);
}

function toggleBadge(event: Event): void {
    if (!owned.value) return;
    propertiesSystem.setShowBadge(selectedState.raw.focus!, (event.target as HTMLInputElement).checked, SERVER_SYNC);
}

function setBlocksVision(bv: VisionBlock): void {
    if (!owned.value) return;
    propertiesSystem.setBlocksVision(selectedState.raw.focus!, bv, SERVER_SYNC);
}

function setBlocksMovement(event: Event): void {
    if (!owned.value) return;
    propertiesSystem.setBlocksMovement(
        selectedState.raw.focus!,
        (event.target as HTMLInputElement).checked,
        SERVER_SYNC,
    );
}

function setStrokeColour(event: string, temporary = false): void {
    if (!owned.value) return;
    propertiesSystem.setStrokeColour(selectedState.raw.focus!, event, temporary ? NO_SYNC : SERVER_SYNC);
}

function setFillColour(colour: string, temporary = false): void {
    if (!owned.value) return;
    propertiesSystem.setFillColour(selectedState.raw.focus!, colour, temporary ? NO_SYNC : SERVER_SYNC);
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

    const shape = getShape(activeShapeStore.state.id);
    if (shape === undefined || shape.type !== "assetrect") return;

    const assetId = await pickAsset();
    if (assetId === null) return;

    const assetInfo = assetState.raw.idMap.get(assetId);
    if (assetInfo === undefined || assetInfo.fileHash === null) return;

    (shape as Asset).setImage(getImageSrcFromHash(assetInfo.fileHash, { addBaseUrl: false }), true);
}
</script>

<template>
    <div v-if="shapeProps" class="panel restore-panel">
        <div class="spanrow header">{{ t("game.ui.selection.edit_dialog.properties.common") }}</div>
        <div class="row">
            <label for="shapeselectiondialog-name">{{ t("common.name") }}</label>
            <input
                id="shapeselectiondialog-name"
                type="text"
                :value="shapeProps.name"
                :disabled="!owned"
                @change="updateName"
            />
            <div
                :style="{ opacity: shapeProps.nameVisible ? 1.0 : 0.3, textAlign: 'center' }"
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
                :checked="shapeProps.isToken"
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
                :checked="shapeProps.isInvisible"
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
                :checked="shapeProps.isDefeated"
                style="grid-column-start: toggle"
                class="styled-checkbox"
                :disabled="!owned"
                @click="setDefeated"
            />
        </div>
        <div class="row">
            <label for="shapeselectiondialog-strokecolour">{{ t("common.border_color") }}</label>
            <ColourPicker
                :colour="
                    shapeProps.strokeColour?.[0]
                        ? getColour(shapeProps.strokeColour[0], activeShapeStore.state.id)
                        : undefined
                "
                style="grid-column-start: toggle"
                :disabled="!owned"
                @input:colour="setStrokeColour($event, true)"
                @update:colour="setStrokeColour($event)"
            />
        </div>
        <div class="row">
            <label for="shapeselectiondialog-fillcolour">{{ t("common.fill_color") }}</label>
            <ColourPicker
                :colour="getColour(shapeProps.fillColour, activeShapeStore.state.id)"
                style="grid-column-start: toggle"
                :disabled="!owned"
                @input:colour="setFillColour($event, true)"
                @update:colour="setFillColour($event)"
            />
        </div>
        <div v-if="isAsset" class="row">
            <label></label>
            <button @click.stop="changeAsset">Change asset</button>
        </div>
        <div class="spanrow header">{{ t("game.ui.selection.edit_dialog.properties.advanced") }}</div>
        <div class="row">
            <label for="shapeselectiondialog-visionblocker">
                {{ t("game.ui.selection.edit_dialog.dialog.block_vision_light") }}
            </label>
            <div style="grid-column-start: toggle; position: relative">
                <ToggleGroup
                    id="kind-selector"
                    :model-value="shapeProps.blocksVision"
                    :options="visionBlocks.map((v) => ({ label: VisionBlock[v], value: v }))"
                    :disabled="!owned"
                    :multi-select="false"
                    active-color="rgba(173, 216, 230, 0.5)"
                    style="position: absolute; right: -10px; top: -22px; width: max-content"
                    @update:model-value="(i) => setBlocksVision(i)"
                />
            </div>
        </div>
        <div class="row">
            <label for="shapeselectiondialog-moveblocker">
                {{ t("game.ui.selection.edit_dialog.dialog.block_movement") }}
            </label>
            <input
                id="shapeselectiondialog-moveblocker"
                type="checkbox"
                :checked="shapeProps.blocksMovement"
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
                :checked="shapeProps.isLocked"
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
                :checked="shapeProps.showBadge"
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
../../../systems/properties/helpers
