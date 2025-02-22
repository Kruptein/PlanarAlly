<script setup lang="ts">
import { useI18n } from "vue-i18n";

import OverrideReset from "./OverrideReset.vue";
import { useClientSettings } from "./useClientSettings";

const { t } = useI18n();

const onlyRenderActiveFloor = useClientSettings("renderAllFloors");
</script>

<template>
    <div class="panel restore-panel">
        <div class="spanrow header">{{ t("game.ui.settings.client.PerformanceSettings.Rendering") }}</div>
        <div class="row">
            <label for="renderAllFloors">
                {{ t("game.ui.settings.client.PerformanceSettings.only_render_active_floor") }}
            </label>
            <div><input id="renderAllFloors" v-model="onlyRenderActiveFloor" type="checkbox" /></div>
            <OverrideReset setting="renderAllFloors" />
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
</style>
