<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import ColourPicker from "../../../../core/components/ColourPicker.vue";
import { GridType } from "../../../../core/grid";
import { NO_SYNC, SERVER_SYNC } from "../../../../core/models/types";
import { getChecked, getValue } from "../../../../core/utils";
import { activeShapeStore } from "../../../../store/activeShape";
import { getShape } from "../../../id";
import { accessState } from "../../../systems/access/state";
import { propertiesSystem } from "../../../systems/properties";
import { useShapeProps } from "../../../systems/properties/composables";
import { selectedState } from "../../../systems/selected/state";
import { locationSettingsState } from "../../../systems/settings/location/state";

const { t } = useI18n();

const shapeProps = useShapeProps();

const owned = accessState.hasEditAccess;

const shape = computed(() => getShape(selectedState.reactive.focus!));

const size = computed(() => {
    if (shapeProps.value!.size === 0) {
        return shape.value!.getSize(locationSettingsState.reactive.gridType.value);
    }
    return shapeProps.value!.size;
});

function setInferSize(event: Event): void {
    _setSize(getChecked(event) ? 0 : size.value);
}

function setSize(event: Event): void {
    _setSize(parseInt(getValue(event)));
}

function _setSize(size: number): void {
    if (!owned.value || shape.value === undefined) return;
    propertiesSystem.setSize(shape.value.id, size, SERVER_SYNC);
}

function setShowCell(event: Event): void {
    if (!owned.value || shape.value === undefined) return;
    propertiesSystem.setShowCells(shape.value.id, getChecked(event), SERVER_SYNC);
}

function setStrokeColour(event: string, temporary = false): void {
    if (!owned.value || shape.value === undefined) return;
    propertiesSystem.setCellStrokeColour(shape.value.id, event, temporary ? NO_SYNC : SERVER_SYNC);
}

function setFillColour(colour: string, temporary = false): void {
    if (!owned.value || shape.value === undefined) return;
    propertiesSystem.setCellFillColour(shape.value.id, colour, temporary ? NO_SYNC : SERVER_SYNC);
}

function setCellStrokeWidth(event: Event): void {
    if (!owned.value || shape.value === undefined) return;
    propertiesSystem.setCellStrokeWidth(shape.value.id, parseInt(getValue(event)), SERVER_SYNC);
}

const showHexSettings = computed(() => {
    if (activeShapeStore.state.type === undefined) return false;
    const gridType = locationSettingsState.reactive.gridType.value;
    if (gridType === GridType.Square) return false;
    return true;
});

function setOddHexOrientation(event: Event): void {
    if (!owned.value || shape.value === undefined) return;
    propertiesSystem.setOddHexOrientation(shape.value.id, (event.target as HTMLInputElement).checked, SERVER_SYNC);
}
</script>

<template>
    <div v-if="shapeProps" class="panel restore-panel">
        <div class="spanrow header">{{ t("game.ui.selection.edit_dialog.grid.appearance") }}</div>
        <div class="row">
            <label for="shapeselectiondialog-infer-size">
                {{ t("game.ui.selection.edit_dialog.grid.infer_size") }}
            </label>
            <input
                id="shapeselectiondialog-infer-size"
                type="checkbox"
                :checked="shapeProps.size === 0"
                style="grid-column-start: toggle"
                class="styled-checkbox"
                :disabled="!owned"
                @click="setInferSize"
            />
        </div>
        <div class="row">
            <label for="shapeselectiondialog-name">{{ t("game.ui.selection.edit_dialog.grid.size") }}</label>
            <input
                id="shapeselectiondialog-name"
                type="number"
                :min="1"
                :step="1"
                :value="size"
                style="grid-column: 2/-1; width: 3rem; justify-self: flex-end"
                :disabled="!owned || shapeProps.size === 0"
                @change="setSize"
            />
        </div>
        <div class="row">
            <label for="shapeselectiondialog-show-cell">{{ t("game.ui.selection.edit_dialog.grid.show_cells") }}</label>
            <input
                id="shapeselectiondialog-show-cell"
                type="checkbox"
                :checked="shapeProps.showCells"
                style="grid-column-start: toggle"
                class="styled-checkbox"
                :disabled="!owned"
                @click="setShowCell"
            />
        </div>
        <div class="row" :class="{ 'row-disabled': !shapeProps.showCells }">
            <label for="shapeselectiondialog-strokecolour">{{ t("common.fill_color") }}</label>
            <ColourPicker
                :colour="shapeProps.cellFillColour"
                style="grid-column-start: toggle"
                :disabled="!owned || !shapeProps.showCells"
                @input:colour="setFillColour($event, true)"
                @update:colour="setFillColour($event)"
            />
        </div>
        <div class="row" :class="{ 'row-disabled': !shapeProps.showCells }">
            <label for="shapeselectiondialog-strokecolour">{{ t("common.stroke_color") }}</label>
            <ColourPicker
                :colour="shapeProps.cellStrokeColour"
                style="grid-column-start: toggle"
                :disabled="!owned || !shapeProps.showCells"
                @input:colour="setStrokeColour($event, true)"
                @update:colour="setStrokeColour($event)"
            />
        </div>
        <div class="row" :class="{ 'row-disabled': !shapeProps.showCells }">
            <label for="shapeselectiondialog-name">{{ t("common.stroke_width") }}</label>
            <input
                id="shapeselectiondialog-name"
                type="number"
                :min="1"
                :step="1"
                :value="shapeProps.cellStrokeWidth"
                style="grid-column: 2/-1; width: 3rem; justify-self: flex-end"
                :disabled="!owned || !shapeProps.showCells"
                @change="setCellStrokeWidth"
            />
        </div>
        <template v-if="showHexSettings">
            <div class="spanrow header">{{ t("game.ui.selection.edit_dialog.grid.hex_settings") }}</div>
            <div class="row">
                <label for="shapeselectiondialog-odd-hex-orientation">
                    {{ t("game.ui.selection.edit_dialog.grid.odd_hex_orientation") }}
                </label>
                <input
                    id="shapeselectiondialog-odd-hex-orientation"
                    type="checkbox"
                    :checked="shapeProps.oddHexOrientation"
                    style="grid-column-start: toggle"
                    class="styled-checkbox"
                    :disabled="!owned"
                    @click="setOddHexOrientation"
                />
            </div>
        </template>
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

.row-disabled > *,
.row-disabled:hover > * {
    cursor: not-allowed;
    color: grey;
}
</style>
../../../systems/properties/helpers
