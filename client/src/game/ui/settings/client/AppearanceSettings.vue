<script setup lang="ts">
import { useI18n } from "vue-i18n";

import ColourPicker from "../../../../core/components/ColourPicker.vue";
import LanguageSelect from "../../../../core/components/LanguageSelect.vue";
import { GridModeLabelFormat } from "../../../systems/settings/players/models";

import OverrideReset from "./OverrideReset.vue";
import { useClientSettings } from "./useClientSettings";

const { t } = useI18n();

const defaultClosedDoorColour = useClientSettings("defaultClosedDoorColour");
const defaultOpenDoorColour = useClientSettings("defaultOpenDoorColour");
const defaultWallColour = useClientSettings("defaultWallColour");
const defaultWindowColour = useClientSettings("defaultWindowColour");
const fowColour = useClientSettings("fowColour");
const gridColour = useClientSettings("gridColour");
const gridModeLabelFormat = useClientSettings("gridModeLabelFormat");
const rulerColour = useClientSettings("rulerColour");
const showTokenDirections = useClientSettings("showTokenDirections");
const useToolIcons = useClientSettings("useToolIcons");
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
            <OverrideReset setting="useToolIcons" />
        </div>
        <div class="spanrow header">{{ t("common.tokens") }}</div>
        <div class="row">
            <label for="showTokenDirections">
                {{ t("game.ui.settings.client.AppearanceSettings.show_token_directions") }}
            </label>
            <div><input id="showTokenDirections" v-model="showTokenDirections" type="checkbox" /></div>
            <OverrideReset setting="showTokenDirections" />
        </div>
        <div class="spanrow header">{{ t("common.grid") }}</div>
        <div class="row">
            <label for="gridColour">{{ t("common.colour") }}</label>
            <div>
                <ColourPicker id="gridColour" v-model:colour="gridColour" />
            </div>
            <OverrideReset setting="gridColour" />
        </div>
        <div class="spanrow header">{{ t("tool.Ruler") }}</div>
        <div class="row">
            <label for="rulerColour">{{ t("common.colour") }}</label>
            <div>
                <ColourPicker id="rulerColour" v-model:colour="rulerColour" />
            </div>
            <OverrideReset setting="rulerColour" />
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
            <OverrideReset setting="gridModeLabelFormat" />
        </div>
        <div class="spanrow header">{{ t("game.ui.settings.client.AppearanceSettings.fog") }}</div>
        <div class="row">
            <label for="fowColour">{{ t("common.colour") }}</label>
            <div>
                <ColourPicker id="fowColour" v-model:colour="fowColour" :disable-alpha="true" />
            </div>
            <OverrideReset setting="fowColour" />
        </div>
        <div class="spanrow header">{{ t("tool.Draw") }}</div>
        <div class="row">
            <label for="defaultWallColour">{{ t("game.ui.settings.client.AppearanceSettings.wall") }}</label>
            <div>
                <ColourPicker id="defaultWallColour" v-model:colour="defaultWallColour" :disable-alpha="true" />
            </div>
            <OverrideReset setting="defaultWallColour" />
        </div>
        <div class="row">
            <label for="defaultWindowColour">{{ t("game.ui.settings.client.AppearanceSettings.window") }}</label>
            <div>
                <ColourPicker id="defaultWindowColour" v-model:colour="defaultWindowColour" :disable-alpha="true" />
            </div>
            <OverrideReset setting="defaultWindowColour" />
        </div>
        <div class="row">
            <label for="defaultClosedDoorColour">
                {{ t("game.ui.settings.client.AppearanceSettings.closed_door") }}
            </label>
            <div>
                <ColourPicker
                    id="defaultClosedDoorColour"
                    v-model:colour="defaultClosedDoorColour"
                    :disable-alpha="true"
                />
            </div>
            <OverrideReset setting="defaultClosedDoorColour" />
        </div>
        <div class="row">
            <label for="defaultOpenDoorColour">{{ t("game.ui.settings.client.AppearanceSettings.open_door") }}</label>
            <div>
                <ColourPicker id="defaultOpenDoorColour" v-model:colour="defaultOpenDoorColour" :disable-alpha="true" />
            </div>
            <OverrideReset setting="defaultOpenDoorColour" />
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
