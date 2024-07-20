<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import { locationSettingsSystem } from "../../../systems/settings/location";
import { locationSettingsState } from "../../../systems/settings/location/state";
import { uiState } from "../../../systems/ui/state";

const props = defineProps<{ global: boolean }>();

const { t } = useI18n();

const { reactive: $, getOption } = locationSettingsState;
const lss = locationSettingsSystem;

const location = computed(() => (props.global ? undefined : uiState.reactive.openedLocationSettings));

const useGrid = computed({
    get() {
        return getOption($.useGrid, location.value).value;
    },
    set(useGrid: boolean | undefined) {
        lss.setUseGrid(useGrid, location.value, true);
    },
});

const gridType = computed({
    get() {
        return getOption($.gridType, location.value).value;
    },
    set(gridType: string | undefined) {
        lss.setGridType(gridType, location.value, true);
    },
});

const unitSize = computed({
    get() {
        return getOption($.unitSize, location.value).value;
    },
    set(unitSize: number | undefined) {
        if (unitSize === undefined || unitSize > 0) lss.setUnitSize(unitSize, location.value, true);
    },
});

const unitSizeUnit = computed({
    get() {
        return getOption($.unitSizeUnit, location.value).value;
    },
    set(unitSizeUnit: string | undefined) {
        lss.setUnitSizeUnit(unitSizeUnit, location.value, true);
    },
});

const dropRatio = computed({
    get() {
        return getOption($.dropRatio, location.value).value;
    },
    set(dropRatio: number | undefined) {
        lss.setDropRatio(dropRatio, location.value, true);
    },
});

function o(k: any): boolean {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return getOption(k, location.value).override !== undefined;
}
</script>

<template>
    <div class="panel restore-panel">
        <div class="spanrow">
            <template v-if="global">
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
        <div class="row" :class="{ overwritten: !global && o($.useGrid) }">
            <label :for="'useGridInput-' + location">{{ t("game.ui.settings.GridSettings.use_grid") }}</label>
            <div>
                <input :id="'useGridInput-' + location" v-model="useGrid" type="checkbox" />
            </div>
            <div
                v-if="!global && o($.useGrid)"
                :title="t('game.ui.settings.common.reset_default')"
                @click="useGrid = undefined"
            >
                <font-awesome-icon icon="times-circle" />
            </div>
            <div v-else></div>
        </div>
        <div class="row" :class="{ overwritten: !global && o($.gridType) }">
            <label :for="'gridType-' + location">{{ t("game.ui.settings.GridSettings.grid_type") }}</label>
            <div>
                <select :id="'gridType-' + location" v-model="gridType">
                    <option value="SQUARE">{{ t("game.ui.settings.GridSettings.SQUARE") }}</option>
                    <option value="POINTY_HEX">{{ t("game.ui.settings.GridSettings.POINTY_HEX") }}</option>
                    <option value="FLAT_HEX">{{ t("game.ui.settings.GridSettings.FLAT_HEX") }}</option>
                </select>
            </div>
            <div
                v-if="!global && o($.gridType)"
                :title="t('game.ui.settings.common.reset_default')"
                @click="gridType = undefined"
            >
                <font-awesome-icon icon="times-circle" />
            </div>
            <div v-else></div>
        </div>
        <div class="row" :class="{ overwritten: !global && o($.unitSizeUnit) }">
            <div>
                <label :for="'unitSizeUnit-' + location">{{ t("game.ui.settings.GridSettings.size_unit") }}</label>
            </div>
            <div>
                <input :id="'unitSizeUnit-' + location" v-model="unitSizeUnit" type="text" />
            </div>
            <div
                v-if="!global && o($.unitSizeUnit)"
                :title="t('game.ui.settings.common.reset_default')"
                @click="unitSizeUnit = undefined"
            >
                <font-awesome-icon icon="times-circle" />
            </div>
            <div v-else></div>
        </div>
        <div class="row" :class="{ overwritten: !global && o($.unitSize) }">
            <div>
                <label :for="'unitSizeInput-' + location">
                    {{ t("game.ui.settings.GridSettings.unit_size_in_UNIT", { unit: unitSizeUnit }) }}
                </label>
            </div>
            <div>
                <input :id="'unitSizeInput-' + location" v-model.number="unitSize" type="number" step="any" />
            </div>
            <div
                v-if="!global && o($.unitSize)"
                :title="t('game.ui.settings.common.reset_default')"
                @click="unitSize = undefined"
            >
                <font-awesome-icon icon="times-circle" />
            </div>
            <div v-else></div>
        </div>
        <div class="row" :class="{ overwritten: !global && o($.dropRatio) }">
            <div>
                <label
                    :for="'dropRatioInput-' + location"
                    title="The drop ratio is used for shapes with size information (e.g. goblin_1x1). The drop ratio is applied to this info to determine the final size."
                >
                    Drop Ratio
                </label>
            </div>
            <div>
                <input :id="'dropRatioInput-' + location" v-model.number="dropRatio" type="number" step="any" />
            </div>
            <div
                v-if="!global && o($.dropRatio)"
                :title="t('game.ui.settings.common.reset_default')"
                @click="dropRatio = undefined"
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
