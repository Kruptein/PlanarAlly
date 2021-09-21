<script setup lang="ts">
import { computed, toRef } from "vue";
import { useI18n } from "vue-i18n";

import ColourPicker from "../../../../core/components/ColourPicker.vue";
import LanguageSelect from "../../../../core/components/LanguageSelect.vue";
import { clientStore } from "../../../../store/client";
import type { UserOptions } from "../../../models/settings";

const { t } = useI18n();

const defaultOptions = toRef(clientStore.state, "defaultClientOptions");

const gridColour = computed({
    get() {
        return clientStore.state.gridColour;
    },
    set(gridColour: string) {
        clientStore.setGridColour(gridColour, true);
    },
});

const fowColour = computed({
    get() {
        return clientStore.state.fowColour;
    },
    set(fowColour: string) {
        clientStore.setFowColour(fowColour, true);
    },
});

const rulerColour = computed({
    get() {
        return clientStore.state.rulerColour;
    },
    set(rulerColour: string) {
        clientStore.setRulerColour(rulerColour, true);
    },
});

function setDefault(key: keyof UserOptions): void {
    clientStore.setDefaultClientOption(key, clientStore.state[key], true);
}
</script>

<template>
    <div class="panel restore-panel">
        <div class="row">
            <label for="languageSelect">{{ t("locale.select") }}</label>
            <div>
                <div><LanguageSelect id="languageSelect" /></div>
            </div>
        </div>
        <div class="spanrow header">Grid</div>
        <div class="row">
            <label for="gridColour">{{ t("common.colour") }}</label>
            <div>
                <ColourPicker id="gridColour" v-model:colour="gridColour" />
            </div>
            <template v-if="gridColour !== defaultOptions.gridColour">
                <div
                    :title="t('game.ui.settings.common.reset_default')"
                    @click="gridColour = defaultOptions.gridColour"
                >
                    <font-awesome-icon icon="times-circle" />
                </div>
                <div :title="t('game.ui.settings.common.sync_default')" @click="setDefault('gridColour')">
                    <font-awesome-icon icon="sync-alt" />
                </div>
            </template>
        </div>
        <div class="spanrow header">Ruler</div>
        <div class="row">
            <label for="rulerColour">{{ t("common.colour") }}</label>
            <div>
                <ColourPicker id="rulerColour" v-model:colour="rulerColour" />
            </div>
            <template v-if="rulerColour !== defaultOptions.rulerColour">
                <div
                    :title="t('game.ui.settings.common.reset_default')"
                    @click="rulerColour = defaultOptions.rulerColour"
                >
                    <font-awesome-icon icon="times-circle" />
                </div>
                <div :title="t('game.ui.settings.common.sync_default')" @click="setDefault('rulerColour')">
                    <font-awesome-icon icon="sync-alt" />
                </div>
            </template>
        </div>
        <div class="spanrow header">Fog</div>
        <div class="row">
            <label for="fowColour">{{ t("common.colour") }}</label>
            <div>
                <ColourPicker id="fowColour" :disableAlpha="true" v-model:colour="fowColour" />
            </div>
            <template v-if="fowColour !== defaultOptions.fowColour">
                <div :title="t('game.ui.settings.common.reset_default')" @click="fowColour = defaultOptions.fowColour">
                    <font-awesome-icon icon="times-circle" />
                </div>
                <div :title="t('game.ui.settings.common.sync_default')" @click="setDefault('fowColour')">
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
