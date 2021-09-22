<script setup lang="ts">
import { computed, toRef } from "vue";
import { useI18n } from "vue-i18n";

import { clientStore } from "../../../../store/client";
import type { UserOptions } from "../../../models/settings";

const { t } = useI18n();

const defaultOptions = toRef(clientStore.state, "defaultClientOptions");

const invertAlt = computed({
    get() {
        return clientStore.state.invertAlt;
    },
    set(invertAlt: boolean) {
        clientStore.setInvertAlt(invertAlt, true);
    },
});

const disableScrollToZoom = computed({
    get() {
        return clientStore.state.disableScrollToZoom;
    },
    set(disableScrollToZoom: boolean) {
        clientStore.setDisableScrollToZoom(disableScrollToZoom, true);
    },
});

function setDefault(key: keyof UserOptions): void {
    clientStore.setDefaultClientOption(key, clientStore.state[key], true);
}
</script>

<template>
    <div class="panel restore-panel">
        <div class="spanrow header">Snapping</div>
        <div class="row">
            <label for="invertAlt">{{ t("game.ui.settings.client.BehaviourSettings.invert_alt_set") }}</label>
            <div><input id="invertAlt" type="checkbox" v-model="invertAlt" /></div>
            <template v-if="invertAlt !== defaultOptions.invertAlt">
                <div :title="t('game.ui.settings.common.reset_default')" @click="invertAlt = defaultOptions.invertAlt">
                    <font-awesome-icon icon="times-circle" />
                </div>
                <div :title="t('game.ui.settings.common.sync_default')" @click="setDefault('invertAlt')">
                    <font-awesome-icon icon="sync-alt" />
                </div>
            </template>
        </div>
        <div class="spanrow header">Mouse & Gestures</div>
        <div class="row">
            <label for="disableScrollToZoom">
                {{ t("game.ui.settings.client.BehaviourSettings.disable_scroll_to_zoom") }}
            </label>
            <div><input id="disableScrollToZoom" type="checkbox" v-model="disableScrollToZoom" /></div>
            <template v-if="disableScrollToZoom !== defaultOptions.disableScrollToZoom">
                <div
                    :title="t('game.ui.settings.common.reset_default')"
                    @click="disableScrollToZoom = defaultOptions.disableScrollToZoom"
                >
                    <font-awesome-icon icon="times-circle" />
                </div>
                <div :title="t('game.ui.settings.common.sync_default')" @click="setDefault('disableScrollToZoom')">
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
