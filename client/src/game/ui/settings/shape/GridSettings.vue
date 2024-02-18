<script setup lang="ts">
import { computed } from "vue";

import ColourPicker from "../../../../core/components/ColourPicker.vue";
import { GridType } from "../../../../core/grid";
import { NO_SYNC, SERVER_SYNC } from "../../../../core/models/types";
import { getChecked, getValue } from "../../../../core/utils";
import { activeShapeStore } from "../../../../store/activeShape";
import { getShape } from "../../../id";
import { accessState } from "../../../systems/access/state";
import { propertiesSystem } from "../../../systems/properties";
import { propertiesState } from "../../../systems/properties/state";
import { locationSettingsState } from "../../../systems/settings/location/state";

const owned = accessState.hasEditAccess;

const shape = computed(() => getShape(propertiesState.reactive.id!));

const size = computed(() => {
    if (propertiesState.reactive.size === 0) {
        return shape.value!.getSize(locationSettingsState.reactive.gridType.value);
    }
    return propertiesState.reactive.size;
});

function setInferSize(event: Event): void {
    _setSize(getChecked(event) ? 0 : size.value);
}

function setSize(event: Event): void {
    _setSize(parseInt(getValue(event)));
}

function _setSize(size: number): void {
    if (!owned.value) return;
    propertiesSystem.setSize(propertiesState.raw.id!, size, SERVER_SYNC);
}

function setShowCell(event: Event): void {
    if (!owned.value) return;
    propertiesSystem.setShowCells(propertiesState.raw.id!, getChecked(event), SERVER_SYNC);
}

function setStrokeColour(event: string, temporary = false): void {
    if (!owned.value) return;
    propertiesSystem.setCellStrokeColour(propertiesState.raw.id!, event, temporary ? NO_SYNC : SERVER_SYNC);
}

function setFillColour(colour: string, temporary = false): void {
    if (!owned.value) return;
    propertiesSystem.setCellFillColour(propertiesState.raw.id!, colour, temporary ? NO_SYNC : SERVER_SYNC);
}

function setCellStrokeWidth(event: Event): void {
    if (!owned.value) return;
    propertiesSystem.setCellStrokeWidth(propertiesState.raw.id!, parseInt(getValue(event)), SERVER_SYNC);
}

const showHexSettings = computed(() => {
    if (activeShapeStore.state.type === undefined) return false;
    const gridType = locationSettingsState.reactive.gridType.value;
    if (gridType === GridType.Square) return false;
    return true;
});

function setOddHexOrientation(event: Event): void {
    if (!owned.value) return;
    propertiesSystem.setOddHexOrientation(
        propertiesState.raw.id!,
        (event.target as HTMLInputElement).checked,
        SERVER_SYNC,
    );
}
</script>

<template>
    <div class="panel restore-panel">
        <div class="spanrow header">Appearance</div>
        <div class="row">
            <label for="shapeselectiondialog-infer-size">Infer size</label>
            <input
                id="shapeselectiondialog-infer-size"
                type="checkbox"
                :checked="propertiesState.reactive.size === 0"
                style="grid-column-start: toggle"
                class="styled-checkbox"
                :disabled="!owned"
                @click="setInferSize"
            />
        </div>
        <div class="row">
            <label for="shapeselectiondialog-name">Size</label>
            <input
                id="shapeselectiondialog-name"
                type="number"
                :min="1"
                :step="1"
                :value="size"
                style="grid-column: 2/-1; width: 3rem; justify-self: flex-end"
                :disabled="!owned || propertiesState.reactive.size === 0"
                @change="setSize"
            />
        </div>
        <div class="row">
            <label for="shapeselectiondialog-show-cell">Show cells</label>
            <input
                id="shapeselectiondialog-show-cell"
                type="checkbox"
                :checked="propertiesState.reactive.showCells"
                style="grid-column-start: toggle"
                class="styled-checkbox"
                :disabled="!owned"
                @click="setShowCell"
            />
        </div>
        <div class="row" :class="{ 'row-disabled': !propertiesState.reactive.showCells }">
            <label for="shapeselectiondialog-strokecolour">Fill colour</label>
            <ColourPicker
                :colour="propertiesState.reactive.cellFillColour"
                style="grid-column-start: toggle"
                :disabled="!owned || !propertiesState.reactive.showCells"
                @input:colour="setFillColour($event, true)"
                @update:colour="setFillColour($event)"
            />
        </div>
        <div class="row" :class="{ 'row-disabled': !propertiesState.reactive.showCells }">
            <label for="shapeselectiondialog-strokecolour">Stroke colour</label>
            <ColourPicker
                :colour="propertiesState.reactive.cellStrokeColour"
                style="grid-column-start: toggle"
                :disabled="!owned || !propertiesState.reactive.showCells"
                @input:colour="setStrokeColour($event, true)"
                @update:colour="setStrokeColour($event)"
            />
        </div>
        <div class="row" :class="{ 'row-disabled': !propertiesState.reactive.showCells }">
            <label for="shapeselectiondialog-name">Stroke width</label>
            <input
                id="shapeselectiondialog-name"
                type="number"
                :min="1"
                :step="1"
                :value="propertiesState.reactive.cellStrokeWidth"
                style="grid-column: 2/-1; width: 3rem; justify-self: flex-end"
                :disabled="!owned || !propertiesState.reactive.showCells"
                @change="setCellStrokeWidth"
            />
        </div>
        <template v-if="showHexSettings">
            <div class="spanrow header">Hex Settings</div>
            <div class="row">
                <label for="shapeselectiondialog-odd-hex-orientation">Odd Hex Orientation</label>
                <input
                    id="shapeselectiondialog-odd-hex-orientation"
                    type="checkbox"
                    :checked="propertiesState.reactive.oddHexOrientation"
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
