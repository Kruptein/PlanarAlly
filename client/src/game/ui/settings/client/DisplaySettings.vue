<script setup lang="ts">
import { useI18n } from "vue-i18n";

import OverrideReset from "./OverrideReset.vue";
import { useClientSettings } from "./useClientSettings";

const { t } = useI18n();

const gridSize = useClientSettings("gridSize");
const miniSize = useClientSettings("miniSize");
const ppi = useClientSettings("ppi");
const useAsPhysicalBoard = useClientSettings("useAsPhysicalBoard");
const useHighDpi = useClientSettings("useHighDpi");
</script>

<template>
    <div class="panel restore-panel">
        <div class="row">
            <label for="useHighDpi">{{ t("game.ui.settings.client.DisplaySettings.use_high_dpi") }}</label>
            <div><input id="useHighDpi" v-model="useHighDpi" type="checkbox" /></div>
            <OverrideReset setting="useHighDpi" />
        </div>
        <div class="spanrow header">{{ t("game.ui.settings.client.DisplaySettings.Gameboard") }}</div>
        <div class="row">
            <label for="useAsPhysicalBoard">
                {{ t("game.ui.settings.client.DisplaySettings.use_as_physical_gameboard") }}
            </label>
            <div>
                <input id="useAsPhysicalBoard" v-model="useAsPhysicalBoard" type="checkbox" />
            </div>
            <OverrideReset setting="useAsPhysicalBoard" />
        </div>
        <div class="row" :class="{ 'row-disabled': !useAsPhysicalBoard }">
            <label for="miniSize">{{ t("game.ui.settings.client.DisplaySettings.mini_size_in_inches") }}</label>
            <div>
                <input id="miniSize" v-model="miniSize" type="number" :disabled="!useAsPhysicalBoard" />
            </div>
            <OverrideReset setting="miniSize" />
        </div>
        <div class="row" :class="{ 'row-disabled': !useAsPhysicalBoard }">
            <label for="ppi">{{ t("game.ui.settings.client.DisplaySettings.ppi") }}</label>
            <div>
                <input id="ppi" v-model="ppi" type="number" :disabled="!useAsPhysicalBoard" />
            </div>
            <OverrideReset setting="ppi" />
        </div>
        <div class="spanrow header">{{ t("common.grid") }}</div>
        <div class="row" :class="{ 'row-disabled': useAsPhysicalBoard }">
            <label for="gridSize">{{ t("game.ui.settings.client.DisplaySettings.grid_size_in_pixels") }}</label>
            <div>
                <input id="gridSize" v-model="gridSize" type="number" :disabled="useAsPhysicalBoard" />
            </div>
            <OverrideReset setting="gridSize" />
        </div>
    </div>
</template>

<style scoped>
/* Force higher specificity without !important abuse */
.panel.restore-panel {
    min-width: 20vw;
    column-gap: 15px;
    grid-template-columns: [setting] 1fr [value] auto [restore] 30px [sync] 30px [end];
}

label {
    grid-column-start: setting;
}

.overwritten,
.restore-panel .row.overwritten * {
    color: #7c253e;
    font-weight: bold;
}

.panel input[type="number"] {
    width: 50px;
}

.row-disabled > *,
.row-disabled:hover > * {
    cursor: not-allowed;
    color: grey;
}
</style>
