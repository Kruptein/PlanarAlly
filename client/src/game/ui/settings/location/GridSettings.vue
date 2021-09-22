<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import { settingsStore } from "../../../../store/settings";
import type { LocationOptions } from "../../../models/settings";

const props = withDefaults(defineProps<{ location?: number }>(), { location: -1 });

const { t } = useI18n();

const isGlobal = computed(() => props.location < 0);

const options = computed(() => {
    if (isGlobal.value) {
        return settingsStore.state.defaultLocationOptions!;
    } else {
        return settingsStore.state.locationOptions.get(props.location) ?? {};
    }
});

const location = computed(() => (isGlobal.value ? undefined : props.location));

const useGrid = computed({
    get() {
        return settingsStore.getLocationOptions("useGrid", location.value);
    },
    set(useGrid: boolean) {
        settingsStore.setUseGrid(useGrid, location.value, true);
    },
});

const gridType = computed({
    get() {
        return settingsStore.getLocationOptions("gridType", location.value);
    },
    set(gridType: string) {
        settingsStore.setGridType(gridType, location.value, true);
    },
});

const unitSize = computed({
    get() {
        return settingsStore.getLocationOptions("unitSize", location.value);
    },
    set(unitSize: number) {
        if (unitSize >= 1) settingsStore.setUnitSize(unitSize, location.value, true);
    },
});

const unitSizeUnit = computed({
    get() {
        return settingsStore.getLocationOptions("unitSizeUnit", location.value);
    },
    set(unitSizeUnit: string) {
        settingsStore.setUnitSizeUnit(unitSizeUnit, location.value, true);
    },
});

function reset(key: keyof LocationOptions): void {
    if (isGlobal.value) return;
    settingsStore.reset(key, props.location);
}

function e(k: any): boolean {
    return k !== undefined && k !== null;
}
</script>

<template>
    <div class="panel restore-panel">
        <div class="spanrow">
            <template v-if="isGlobal">
                <em style="max-width: 40vw">
                    {{ t("game.ui.settings.common.overridden_msg") }}
                </em>
            </template>
            <template v-else>
                <i18n-t keypath="game.ui.settings.common.overridden_highlight_path" tag="span">
                    <span class="overwritten">{{ t("game.ui.settings.common.overridden_highlight") }}</span>
                </i18n-t>
            </template>
        </div>
        <div class="row" :class="{ overwritten: !isGlobal && e(options.useGrid) }">
            <label :for="'useGridInput-' + location">{{ t("game.ui.settings.GridSettings.use_grid") }}</label>
            <div>
                <input :id="'useGridInput-' + location" type="checkbox" v-model="useGrid" />
            </div>
            <div
                v-if="!isGlobal && e(options.useGrid)"
                @click="reset('useGrid')"
                :title="t('game.ui.settings.common.reset_default')"
            >
                <font-awesome-icon icon="times-circle" />
            </div>
            <div v-else></div>
        </div>
        <div class="row" :class="{ overwritten: !isGlobal && e(options.gridType) }">
            <label :for="'gridType-' + location">{{ t("game.ui.settings.GridSettings.grid_type") }}</label>
            <div>
                <select :id="'gridType-' + location" v-model="gridType">
                    <option value="SQUARE">{{ t("game.ui.settings.GridSettings.SQUARE") }}</option>
                    <option value="POINTY_HEX">{{ t("game.ui.settings.GridSettings.POINTY_HEX") }}</option>
                    <option value="FLAT_HEX">{{ t("game.ui.settings.GridSettings.FLAT_HEX") }}</option>
                </select>
            </div>
            <div
                v-if="!isGlobal && e(options.gridType)"
                @click="reset('gridType')"
                :title="t('game.ui.settings.common.reset_default')"
            >
                <font-awesome-icon icon="times-circle" />
            </div>
            <div v-else></div>
        </div>
        <div class="row" :class="{ overwritten: !isGlobal && e(options.unitSizeUnit) }">
            <div>
                <label :for="'unitSizeUnit-' + location">{{ t("game.ui.settings.GridSettings.size_unit") }}</label>
            </div>
            <div>
                <input :id="'unitSizeUnit-' + location" type="text" v-model="unitSizeUnit" />
            </div>
            <div
                v-if="!isGlobal && e(options.unitSizeUnit)"
                @click="reset('unitSizeUnit')"
                :title="t('game.ui.settings.common.reset_default')"
            >
                <font-awesome-icon icon="times-circle" />
            </div>
            <div v-else></div>
        </div>
        <div class="row" :class="{ overwritten: !isGlobal && e(options.unitSize) }">
            <div>
                <label :for="'unitSizeInput-' + location">
                    {{ t("game.ui.settings.GridSettings.unit_size_in_UNIT", { unit: unitSizeUnit }) }}
                </label>
            </div>
            <div>
                <input :id="'unitSizeInput-' + location" type="number" step="any" v-model.number="unitSize" />
            </div>
            <div
                v-if="!isGlobal && e(options.unitSize)"
                @click="reset('unitSize')"
                :title="t('game.ui.settings.common.reset_default')"
            >
                <font-awesome-icon icon="times-circle" />
            </div>
            <div v-else></div>
        </div>
    </div>
</template>

<style scoped>
/* Force higher specificity without !important abuse */
.panel.restore-panel {
    grid-template-columns: [setting] 1fr [value] auto [restore] 30px [end];
}

.overwritten,
.restore-panel .row.overwritten * {
    color: #7c253e;
    font-weight: bold;
}
</style>
