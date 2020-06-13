<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop } from "vue-property-decorator";

import { gameSettingsStore, getLocationOption } from "../../settings";
import { LocationOptions } from "../../comm/types/settings";

@Component
export default class GridSettings extends Vue {
    @Prop() location!: number | null;

    get defaults(): LocationOptions {
        return gameSettingsStore.defaultLocationOptions!;
    }

    get options(): Partial<LocationOptions> {
        if (this.location === null) return this.defaults;
        return gameSettingsStore.locationOptions[this.location] ?? {};
    }

    get useGrid(): boolean {
        return getLocationOption("useGrid", this.location)!;
    }
    set useGrid(value: boolean) {
        gameSettingsStore.setUseGrid({ useGrid: value, location: this.location, sync: true });
    }
    get unitSize(): number {
        return getLocationOption("unitSize", this.location)!;
    }
    set unitSize(value: number) {
        if (typeof value !== "number") return;
        gameSettingsStore.setUnitSize({ unitSize: value, location: this.location, sync: true });
    }
    get unitSizeUnit(): string {
        return getLocationOption("unitSizeUnit", this.location)!;
    }
    set unitSizeUnit(value: string) {
        gameSettingsStore.setUnitSizeUnit({ unitSizeUnit: value, location: this.location, sync: true });
    }
    get gridSize(): number {
        return getLocationOption("gridSize", this.location)!;
    }
    set gridSize(value: number) {
        if (typeof value !== "number") return;
        gameSettingsStore.setGridSize({ gridSize: value, location: this.location, sync: true });
    }

    reset(key: keyof LocationOptions): void {
        if (this.location === null) return;
        gameSettingsStore.reset({ key, location: this.location });
    }
}
</script>

<template>
    <div class="panel restore-panel">
        <div class="spanrow">
            <template v-if="location === null">
                <em style="max-width: 40vw">
                    {{ $t("game.ui.settings.common.overridden_msg") }}
                </em>
            </template>
            <template v-else>
                <i18n path="game.ui.settings.common.overridden_highlight_path" tag="span">
                    <span class="overwritten">{{ $t("game.ui.settings.common.overridden_highlight") }}</span>
                </i18n>
            </template>
        </div>
        <div class="row" :class="{ overwritten: location !== null && options.useGrid !== undefined }">
            <label :for="'useGridInput-' + location" v-t="'game.ui.settings.GridSettings.use_grid'"></label>
            <div>
                <input :id="'useGridInput-' + location" type="checkbox" v-model="useGrid" />
            </div>
            <div
                v-if="location !== null && options.useGrid !== undefined"
                @click="reset('useGrid')"
                :title="$t('game.ui.settings.common.reset_default')"
            >
                <i aria-hidden="true" class="fas fa-times-circle"></i>
            </div>
            <div v-else></div>
        </div>
        <div class="row" :class="{ overwritten: location !== null && options.gridSize !== undefined }">
            <label :for="'gridSizeInput-' + location" v-t="'game.ui.settings.GridSettings.grid_size_in_pixels'"></label>
            <div>
                <input :id="'gridSizeInput-' + location" type="number" min="0" v-model.number="gridSize" />
            </div>
            <div
                v-if="location !== null && options.gridSize !== undefined"
                @click="reset('gridSize')"
                :title="$t('game.ui.settings.common.reset_default')"
            >
                <i aria-hidden="true" class="fas fa-times-circle"></i>
            </div>
            <div v-else></div>
        </div>
        <div class="row" :class="{ overwritten: location !== null && options.unitSizeUnit !== undefined }">
            <div>
                <label :for="'unitSizeUnit-' + location" v-t="'game.ui.settings.GridSettings.size_unit'"></label>
            </div>
            <div>
                <input :id="'unitSizeUnit-' + location" type="text" v-model="unitSizeUnit" />
            </div>
            <div
                v-if="location !== null && options.unitSizeUnit !== undefined"
                @click="reset('unitSizeUnit')"
                :title="$t('game.ui.settings.common.reset_default')"
            >
                <i aria-hidden="true" class="fas fa-times-circle"></i>
            </div>
            <div v-else></div>
        </div>
        <div class="row" :class="{ overwritten: location !== null && options.unitSize !== undefined }">
            <div>
                <label :for="'unitSizeInput-' + location">
                    {{ $t("game.ui.settings.GridSettings.unit_size_in_UNIT", { unit: unitSizeUnit }) }}
                </label>
            </div>
            <div>
                <input :id="'unitSizeInput-' + location" type="number" step="any" v-model.number="unitSize" />
            </div>
            <div
                v-if="location !== null && options.unitSize !== undefined"
                @click="reset('unitSize')"
                :title="$t('game.ui.settings.common.reset_default')"
            >
                <i aria-hidden="true" class="fas fa-times-circle"></i>
            </div>
            <div v-else></div>
        </div>
    </div>
</template>

<style scoped>
/* Force higher specificity without !important abuse */
.panel.restore-panel {
    grid-template-columns: [setting] 1fr [value] 1fr [restore] 30px [end];
}

.overwritten,
.restore-panel .row.overwritten * {
    color: #7c253e;
    font-weight: bold;
}
</style>
