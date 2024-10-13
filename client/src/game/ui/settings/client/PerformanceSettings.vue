<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import { playerSettingsSystem } from "../../../systems/settings/players";
import { playerSettingsState } from "../../../systems/settings/players/state";

const { t } = useI18n();

const { reactive: $ } = playerSettingsState;
const pss = playerSettingsSystem;

const onlyRenderActiveFloor = computed<boolean | undefined>({
    get() {
        return !$.renderAllFloors.value;
    },
    set(onlyRenderActiveFloor: boolean | undefined) {
        const renderAllFloors = onlyRenderActiveFloor === undefined ? undefined : !onlyRenderActiveFloor;
        pss.setRenderAllFloors(renderAllFloors, { sync: true });
    },
});
</script>

<template>
    <div class="panel restore-panel">
        <div class="spanrow header">Rendering</div>
        <div class="row">
            <label for="renderAllFloors">
                {{ t("game.ui.settings.client.PerformanceSettings.only_render_active_floor") }}
            </label>
            <div><input id="renderAllFloors" v-model="onlyRenderActiveFloor" type="checkbox" /></div>
            <template v-if="$.renderAllFloors.override !== undefined">
                <div :title="t('game.ui.settings.common.reset_default')" @click="onlyRenderActiveFloor = undefined">
                    <font-awesome-icon icon="times-circle" />
                </div>
                <div
                    :title="t('game.ui.settings.common.sync_default')"
                    @click="pss.setRenderAllFloors(undefined, { sync: true, default: $.renderAllFloors.override })"
                >
                    <font-awesome-icon icon="sync-alt" />
                </div>
            </template>
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
