<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import { uiState } from "../../../systems/ui/state";

import ResetWrapper from "./ResetWrapper.vue";
import { useLocationSettings } from "./useLocationSettings";

const props = defineProps<{ global: boolean }>();

const { t } = useI18n();

const location = computed(() => (props.global ? undefined : uiState.reactive.openedLocationSettings));

const useGrid = useLocationSettings("useGrid", location);
const gridType = useLocationSettings("gridType", location);

const unitSize = useLocationSettings("unitSize", location);
const unitSizeUnit = useLocationSettings("unitSizeUnit", location);
const dropRatio = useLocationSettings("dropRatio", location);
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
        <ResetWrapper :global="global" :location="location" setting="useGrid">
            <label :for="'useGridInput-' + location">{{ t("game.ui.settings.GridSettings.use_grid") }}</label>
            <div>
                <input :id="'useGridInput-' + location" v-model="useGrid" type="checkbox" />
            </div>
        </ResetWrapper>
        <ResetWrapper :global="global" :location="location" setting="gridType">
            <label :for="'gridType-' + location">{{ t("game.ui.settings.GridSettings.grid_type") }}</label>
            <div>
                <select :id="'gridType-' + location" v-model="gridType">
                    <option value="SQUARE">{{ t("game.ui.settings.GridSettings.SQUARE") }}</option>
                    <option value="POINTY_HEX">{{ t("game.ui.settings.GridSettings.POINTY_HEX") }}</option>
                    <option value="FLAT_HEX">{{ t("game.ui.settings.GridSettings.FLAT_HEX") }}</option>
                </select>
            </div>
        </ResetWrapper>
        <ResetWrapper :global="global" :location="location" setting="unitSizeUnit">
            <div>
                <label :for="'unitSizeUnit-' + location">{{ t("game.ui.settings.GridSettings.size_unit") }}</label>
            </div>
            <div>
                <input :id="'unitSizeUnit-' + location" v-model="unitSizeUnit" type="text" />
            </div>
        </ResetWrapper>
        <ResetWrapper :global="global" :location="location" setting="unitSize">
            <div>
                <label :for="'unitSizeInput-' + location">
                    {{ t("game.ui.settings.GridSettings.unit_size_in_UNIT", { unit: unitSizeUnit }) }}
                </label>
            </div>
            <div>
                <input :id="'unitSizeInput-' + location" v-model.number="unitSize" type="number" step="any" />
            </div>
        </ResetWrapper>
        <ResetWrapper :global="global" :location="location" setting="dropRatio">
            <div>
                <label :for="'dropRatioInput-' + location" :title="t('game.ui.settings.GridSettings.drop_ratio_title')">
                    {{ t("game.ui.settings.GridSettings.drop_ratio") }}
                </label>
            </div>
            <div>
                <input :id="'dropRatioInput-' + location" v-model.number="dropRatio" type="number" step="any" />
            </div>
        </ResetWrapper>
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
