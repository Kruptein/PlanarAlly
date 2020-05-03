<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop } from "vue-property-decorator";

import { gameSettingsStore } from "../../settings";

@Component
export default class GridSettings extends Vue {
    @Prop() location!: string | null;

    get useGrid(): boolean {
        return gameSettingsStore.useGrid;
    }
    // set useGrid(value: boolean) {
    //     gameSettingsStore.setUseGrid({ useGrid: value, location: this.location, sync: true });
    // }
    get unitSize(): number {
        console.log(gameSettingsStore.unitSize);
        return gameSettingsStore.unitSize;
    }
    set unitSize(value: number) {
        if (typeof value !== "number") return;
        gameSettingsStore.setUnitSize({ unitSize: value, location: this.location, sync: true });
    }
    get unitSizeUnit(): string {
        return gameSettingsStore.unitSizeUnit;
    }
    set unitSizeUnit(value: string) {
        gameSettingsStore.setUnitSizeUnit({ unitSizeUnit: value, location: this.location, sync: true });
    }
    get gridSize(): number {
        return gameSettingsStore.gridSize;
    }
    set gridSize(value: number) {
        if (typeof value !== "number") return;
        gameSettingsStore.setGridSize({ gridSize: value, location: this.location, sync: true });
    }
}
</script>

<template>
    <div class="panel">
        <div class="spanrow">
            <i style="max-width: 40vw">These settings can be overriden by location specific settings</i>
        </div>
        <div class="row">
            <label :for="'useGridInput-' + location">Use grid</label>
            <div>
                <input :id="'useGridInput-' + location" type="checkbox" v-model="useGrid" />
            </div>
        </div>
        <div class="row">
            <label :for="'gridSizeInput-' + location">Grid Size (in pixels):</label>
            <div>
                <input :id="'gridSizeInput-' + location" type="number" min="0" v-model.number="gridSize" />
            </div>
        </div>
        <div class="row">
            <div>
                <label :for="'unitSizeUnit-' + location">Size Unit</label>
            </div>
            <div>
                <input :id="'unitSizeUnit-' + location" type="text" v-model="unitSizeUnit" />
            </div>
        </div>
        <div class="row">
            <div>
                <label :for="'unitSizeInput-' + location">Unit Size (in {{ unitSizeUnit }})</label>
            </div>
            <div>
                <input :id="'unitSizeInput-' + location" type="number" v-model.number="unitSize" />
            </div>
        </div>
    </div>
</template>
