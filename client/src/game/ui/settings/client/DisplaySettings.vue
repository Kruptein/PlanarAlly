<script setup lang="ts">
import { computed, toRef } from "vue";
import { useI18n } from "vue-i18n";

import { clientStore } from "../../../../store/client";
import type { UserOptions } from "../../../models/settings";

const { t } = useI18n();

const defaultOptions = toRef(clientStore.state, "defaultClientOptions");

const useHighDpi = computed({
    get() {
        return clientStore.state.useHighDpi;
    },
    set(useHighDpi: boolean) {
        clientStore.setUseHighDpi(useHighDpi, true);
    },
});

const gridSize = computed({
    get() {
        return clientStore.state.gridSize;
    },
    set(gridSize: number) {
        if (gridSize >= 1) {
            clientStore.setGridSize(gridSize, true);
        }
    },
});

const useAsPhysicalBoard = computed({
    get() {
        return clientStore.state.useAsPhysicalBoard;
    },
    set(useAsPhysicalBoard: boolean) {
        clientStore.setUseAsPhysicalBoard(useAsPhysicalBoard, true);
    },
});

const miniSize = computed({
    get() {
        return clientStore.state.miniSize;
    },
    set(miniSize: number) {
        if (miniSize >= 1) {
            clientStore.setMiniSize(miniSize, true);
        }
    },
});

const ppi = computed({
    get() {
        return clientStore.state.ppi;
    },
    set(ppi: number) {
        if (ppi >= 1) {
            clientStore.setPpi(ppi, true);
        }
    },
});

function setDefault(key: keyof UserOptions): void {
    clientStore.setDefaultClientOption(key, clientStore.state[key], true);
}
</script>

<template>
    <div class="panel restore-panel">
        <div class="row">
            <label for="useHighDpi">{{ t("game.ui.settings.client.DisplaySettings.use_high_dpi") }}</label>
            <div><input id="useHighDpi" type="checkbox" v-model="useHighDpi" /></div>
            <template v-if="useHighDpi !== defaultOptions.useHighDpi">
                <div
                    :title="t('game.ui.settings.common.reset_default')"
                    @click="useHighDpi = defaultOptions.useHighDpi"
                >
                    <font-awesome-icon icon="times-circle" />
                </div>
                <div :title="t('game.ui.settings.common.sync_default')" @click="setDefault('useHighDpi')">
                    <font-awesome-icon icon="sync-alt" />
                </div>
            </template>
        </div>
        <div class="spanrow header">Gameboard</div>
        <div class="row">
            <label for="useAsPhysicalBoard">
                {{ t("game.ui.settings.client.DisplaySettings.use_as_physical_gameboard") }}
            </label>
            <div><input id="useAsPhysicalBoard" type="checkbox" v-model="useAsPhysicalBoard" /></div>
            <template v-if="useAsPhysicalBoard !== defaultOptions.useAsPhysicalBoard">
                <div
                    :title="t('game.ui.settings.common.reset_default')"
                    @click="useAsPhysicalBoard = defaultOptions.useAsPhysicalBoard"
                >
                    <font-awesome-icon icon="times-circle" />
                </div>
                <div :title="t('game.ui.settings.common.sync_default')" @click="setDefault('useAsPhysicalBoard')">
                    <font-awesome-icon icon="sync-alt" />
                </div>
            </template>
        </div>
        <div class="row" :class="{ 'row-disabled': !useAsPhysicalBoard }">
            <label for="miniSize">{{ t("game.ui.settings.client.DisplaySettings.mini_size_in_inches") }}</label>
            <div>
                <input id="miniSize" type="number" v-model="miniSize" :disabled="!useAsPhysicalBoard" />
            </div>
            <template v-if="miniSize !== defaultOptions.miniSize">
                <div :title="t('game.ui.settings.common.reset_default')" @click="miniSize = defaultOptions.miniSize">
                    <font-awesome-icon icon="times-circle" />
                </div>
                <div :title="t('game.ui.settings.common.sync_default')" @click="setDefault('miniSize')">
                    <font-awesome-icon icon="sync-alt" />
                </div>
            </template>
        </div>
        <div class="row" :class="{ 'row-disabled': !useAsPhysicalBoard }">
            <label for="ppi">{{ t("game.ui.settings.client.DisplaySettings.ppi") }}</label>
            <div>
                <input id="ppi" type="number" v-model="ppi" :disabled="!useAsPhysicalBoard" />
            </div>
            <template v-if="ppi !== defaultOptions.ppi">
                <div :title="t('game.ui.settings.common.reset_default')" @click="ppi = defaultOptions.ppi">
                    <font-awesome-icon icon="times-circle" />
                </div>
                <div :title="t('game.ui.settings.common.sync_default')" @click="setDefault('ppi')">
                    <font-awesome-icon icon="sync-alt" />
                </div>
            </template>
        </div>
        <div class="spanrow header">Grid</div>
        <div class="row" :class="{ 'row-disabled': useAsPhysicalBoard }">
            <label for="gridSize">{{ t("game.ui.settings.client.DisplaySettings.grid_size_in_pixels") }}</label>
            <div>
                <input id="gridSize" type="number" v-model="gridSize" :disabled="useAsPhysicalBoard" />
            </div>
            <template v-if="gridSize !== defaultOptions.gridSize">
                <div :title="t('game.ui.settings.common.reset_default')" @click="gridSize = defaultOptions.gridSize">
                    <font-awesome-icon icon="times-circle" />
                </div>
                <div :title="t('game.ui.settings.common.sync_default')" @click="setDefault('gridSize')">
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
