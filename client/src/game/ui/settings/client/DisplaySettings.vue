<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import { playerSettingsSystem } from "../../../systems/settings/players";
import { playerSettingsState } from "../../../systems/settings/players/state";

const { t } = useI18n();

const { reactive: $ } = playerSettingsState;
const pss = playerSettingsSystem;

const useHighDpi = computed<boolean | undefined>({
    get() {
        return $.useHighDpi.value;
    },
    set(useHighDpi: boolean | undefined) {
        pss.setUseHighDpi(useHighDpi, { sync: true });
    },
});

const gridSize = computed<number | undefined>({
    get() {
        return $.gridSize.value;
    },
    set(gridSize: number | undefined) {
        if (gridSize !== undefined && gridSize < 1) return;
        pss.setGridSize(gridSize, { sync: true });
    },
});

const useAsPhysicalBoard = computed<boolean | undefined>({
    get() {
        return $.useAsPhysicalBoard.value;
    },
    set(useAsPhysicalBoard: boolean | undefined) {
        pss.setUseAsPhysicalBoard(useAsPhysicalBoard, { sync: true });
    },
});

const miniSize = computed<number | undefined>({
    get() {
        return $.miniSize.value;
    },
    set(miniSize: number | undefined) {
        if (miniSize !== undefined && miniSize < 1) return;
        pss.setMiniSize(miniSize, { sync: true });
    },
});

const ppi = computed<number | undefined>({
    get() {
        return $.ppi.value;
    },
    set(ppi: number | undefined) {
        if (ppi !== undefined && ppi < 1) return;
        pss.setPpi(ppi, { sync: true });
    },
});
</script>

<template>
    <div class="panel restore-panel">
        <div class="row">
            <label for="useHighDpi">{{ t("game.ui.settings.client.DisplaySettings.use_high_dpi") }}</label>
            <div><input id="useHighDpi" v-model="useHighDpi" type="checkbox" /></div>
            <template v-if="$.useHighDpi.override !== undefined">
                <div :title="t('game.ui.settings.common.reset_default')" @click="useHighDpi = undefined">
                    <font-awesome-icon icon="times-circle" />
                </div>
                <div
                    :title="t('game.ui.settings.common.sync_default')"
                    @click="pss.setUseHighDpi(undefined, { sync: true, default: $.useHighDpi.override })"
                >
                    <font-awesome-icon icon="sync-alt" />
                </div>
            </template>
        </div>
        <div class="spanrow header">Gameboard</div>
        <div class="row">
            <label for="useAsPhysicalBoard">
                {{ t("game.ui.settings.client.DisplaySettings.use_as_physical_gameboard") }}
            </label>
            <div>
                <input id="useAsPhysicalBoard" v-model="useAsPhysicalBoard" type="checkbox" />
            </div>
            <template v-if="$.useAsPhysicalBoard.override !== undefined">
                <div :title="t('game.ui.settings.common.reset_default')" @click="useAsPhysicalBoard = undefined">
                    <font-awesome-icon icon="times-circle" />
                </div>
                <div
                    :title="t('game.ui.settings.common.sync_default')"
                    @click="
                        pss.setUseAsPhysicalBoard(undefined, { sync: true, default: $.useAsPhysicalBoard.override })
                    "
                >
                    <font-awesome-icon icon="sync-alt" />
                </div>
            </template>
        </div>
        <div class="row" :class="{ 'row-disabled': !useAsPhysicalBoard }">
            <label for="miniSize">{{ t("game.ui.settings.client.DisplaySettings.mini_size_in_inches") }}</label>
            <div>
                <input id="miniSize" v-model="miniSize" type="number" :disabled="!useAsPhysicalBoard" />
            </div>
            <template v-if="$.miniSize.override !== undefined">
                <div :title="t('game.ui.settings.common.reset_default')" @click="miniSize = undefined">
                    <font-awesome-icon icon="times-circle" />
                </div>
                <div
                    :title="t('game.ui.settings.common.sync_default')"
                    @click="pss.setMiniSize(undefined, { sync: true, default: $.miniSize.override })"
                >
                    <font-awesome-icon icon="sync-alt" />
                </div>
            </template>
        </div>
        <div class="row" :class="{ 'row-disabled': !useAsPhysicalBoard }">
            <label for="ppi">{{ t("game.ui.settings.client.DisplaySettings.ppi") }}</label>
            <div>
                <input id="ppi" v-model="ppi" type="number" :disabled="!useAsPhysicalBoard" />
            </div>
            <template v-if="$.ppi.override !== undefined">
                <div :title="t('game.ui.settings.common.reset_default')" @click="ppi = undefined">
                    <font-awesome-icon icon="times-circle" />
                </div>
                <div
                    :title="t('game.ui.settings.common.sync_default')"
                    @click="pss.setPpi(undefined, { sync: true, default: $.ppi.override })"
                >
                    <font-awesome-icon icon="sync-alt" />
                </div>
            </template>
        </div>
        <div class="spanrow header">Grid</div>
        <div class="row" :class="{ 'row-disabled': useAsPhysicalBoard }">
            <label for="gridSize">{{ t("game.ui.settings.client.DisplaySettings.grid_size_in_pixels") }}</label>
            <div>
                <input id="gridSize" v-model="gridSize" type="number" :disabled="useAsPhysicalBoard" />
            </div>
            <template v-if="$.gridSize.override !== undefined">
                <div :title="t('game.ui.settings.common.reset_default')" @click="gridSize = undefined">
                    <font-awesome-icon icon="times-circle" />
                </div>
                <div
                    :title="t('game.ui.settings.common.sync_default')"
                    @click="pss.setGridSize(undefined, { sync: true, default: $.gridSize.override })"
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

.row-disabled > *,
.row-disabled:hover > * {
    cursor: not-allowed;
    color: grey;
}
</style>
