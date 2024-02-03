<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import ColourPicker from "../../../../core/components/ColourPicker.vue";
import LanguageSelect from "../../../../core/components/LanguageSelect.vue";
import { playerSettingsSystem } from "../../../systems/settings/players";
import { GridModeLabelFormat } from "../../../systems/settings/players/models";
import { playerSettingsState } from "../../../systems/settings/players/state";

const { t } = useI18n();

const { reactive: $ } = playerSettingsState;
const pss = playerSettingsSystem;

const useToolIcons = computed({
    get() {
        return $.useToolIcons.value;
    },
    set(useToolIcons: boolean | undefined) {
        pss.setUseToolIcons(useToolIcons, { sync: true });
    },
});

const showTokenDirections = computed({
    get() {
        return $.showTokenDirections.value;
    },
    set(showTokenDirections: boolean | undefined) {
        pss.setShowTokenDirections(showTokenDirections, { sync: true });
    },
});

const gridColour = computed({
    get() {
        return $.gridColour.value;
    },
    set(gridColour: string | undefined) {
        pss.setGridColour(gridColour, { sync: true });
    },
});

const gridModeLabelFormat = computed({
    get() {
        return $.gridModeLabelFormat.value;
    },
    set(gridModeLabelFormat: GridModeLabelFormat | undefined) {
        pss.setGridModeLabelFormat(gridModeLabelFormat, { sync: true });
    },
});

const fowColour = computed({
    get() {
        return $.fowColour.value;
    },
    set(fowColour: string | undefined) {
        pss.setFowColour(fowColour, { sync: true });
    },
});

const rulerColour = computed({
    get() {
        return $.rulerColour.value;
    },
    set(rulerColour: string | undefined) {
        pss.setRulerColour(rulerColour, { sync: true });
    },
});
</script>

<template>
    <div class="panel restore-panel">
        <div class="row">
            <label for="languageSelect">{{ t("locale.select") }}</label>
            <div>
                <div><LanguageSelect id="languageSelect" /></div>
            </div>
        </div>
        <div class="spanrow header">{{ t("game.ui.settings.client.AppearanceSettings.toolbars") }}</div>
        <div class="row">
            <label for="useToolIcons">{{ t("game.ui.settings.client.AppearanceSettings.use_tool_icons") }}</label>
            <div><input id="useToolIcons" v-model="useToolIcons" type="checkbox" /></div>
            <template v-if="$.useToolIcons.override !== undefined">
                <div :title="t('game.ui.settings.common.reset_default')" @click="useToolIcons = undefined">
                    <font-awesome-icon icon="times-circle" />
                </div>
                <div
                    :title="t('game.ui.settings.common.sync_default')"
                    @click="pss.setUseToolIcons(undefined, { sync: true, default: $.useToolIcons.override })"
                >
                    <font-awesome-icon icon="sync-alt" />
                </div>
            </template>
        </div>
        <div class="spanrow header">{{ t("common.tokens") }}</div>
        <div class="row">
            <label for="showTokenDirections">
                {{ t("game.ui.settings.client.AppearanceSettings.show_token_directions") }}
            </label>
            <div><input id="showTokenDirections" v-model="showTokenDirections" type="checkbox" /></div>
            <template v-if="$.showTokenDirections.override !== undefined">
                <div :title="t('game.ui.settings.common.reset_default')" @click="showTokenDirections = undefined">
                    <font-awesome-icon icon="times-circle" />
                </div>
                <div
                    :title="t('game.ui.settings.common.sync_default')"
                    @click="
                        pss.setShowTokenDirections(undefined, { sync: true, default: $.showTokenDirections.override })
                    "
                >
                    <font-awesome-icon icon="sync-alt" />
                </div>
            </template>
        </div>
        <div class="spanrow header">{{ t("common.grid") }}</div>
        <div class="row">
            <label for="gridColour">{{ t("common.colour") }}</label>
            <div>
                <ColourPicker id="gridColour" v-model:colour="gridColour" />
            </div>
            <template v-if="$.gridColour.override !== undefined">
                <div :title="t('game.ui.settings.common.reset_default')" @click="gridColour = undefined">
                    <font-awesome-icon icon="times-circle" />
                </div>
                <div
                    :title="t('game.ui.settings.common.sync_default')"
                    @click="pss.setGridColour(undefined, { sync: true, default: $.gridColour.override })"
                >
                    <font-awesome-icon icon="sync-alt" />
                </div>
            </template>
        </div>
        <div class="spanrow header">{{ t("tool.Ruler") }}</div>
        <div class="row">
            <label for="rulerColour">{{ t("common.colour") }}</label>
            <div>
                <ColourPicker id="rulerColour" v-model:colour="rulerColour" />
            </div>
            <template v-if="$.rulerColour.override !== undefined">
                <div :title="t('game.ui.settings.common.reset_default')" @click="rulerColour = undefined">
                    <font-awesome-icon icon="times-circle" />
                </div>
                <div
                    :title="t('game.ui.settings.common.sync_default')"
                    @click="pss.setRulerColour(undefined, { sync: true, default: $.rulerColour.override })"
                >
                    <font-awesome-icon icon="sync-alt" />
                </div>
            </template>
        </div>
        <div class="row">
            <label for="gridModeLabelFormat">
                {{ t("game.ui.settings.client.AppearanceSettings.grid_mode_label_format") }}
            </label>
            <div>
                <select v-model="gridModeLabelFormat">
                    <option
                        v-for="option in Object.keys(GridModeLabelFormat).length / 2"
                        :key="option"
                        :value="option - 1"
                        :label="t('game.ui.settings.client.AppearanceSettings.grid_mode_label_format_' + (option - 1))"
                        :selected="option - 1 === gridModeLabelFormat"
                    ></option>
                </select>
            </div>
            <template v-if="$.gridModeLabelFormat.override !== undefined">
                <div :title="t('game.ui.settings.common.reset_default')" @click="gridModeLabelFormat = undefined">
                    <font-awesome-icon icon="times-circle" />
                </div>
                <div
                    :title="t('game.ui.settings.common.sync_default')"
                    @click="
                        pss.setGridModeLabelFormat(undefined, {
                            sync: true,
                            default: $.gridModeLabelFormat.override,
                        })
                    "
                >
                    <font-awesome-icon icon="sync-alt" />
                </div>
            </template>
        </div>
        <div class="spanrow header">{{ t("game.ui.settings.client.AppearanceSettings.fog") }}</div>
        <div class="row">
            <label for="fowColour">{{ t("common.colour") }}</label>
            <div>
                <ColourPicker id="fowColour" v-model:colour="fowColour" :disable-alpha="true" />
            </div>
            <template v-if="$.fowColour.override !== undefined">
                <div :title="t('game.ui.settings.common.reset_default')" @click="fowColour = undefined">
                    <font-awesome-icon icon="times-circle" />
                </div>
                <div
                    :title="t('game.ui.settings.common.sync_default')"
                    @click="pss.setFowColour(undefined, { sync: true, default: $.fowColour.override })"
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
