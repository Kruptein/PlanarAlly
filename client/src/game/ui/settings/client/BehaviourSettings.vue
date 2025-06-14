<script setup lang="ts">
import { useI18n } from "vue-i18n";

import OverrideReset from "./OverrideReset.vue";
import { useClientSettings } from "./useClientSettings";

const { t } = useI18n();

const defaultTrackerMode = useClientSettings("defaultTrackerMode");
const disableScrollToZoom = useClientSettings("disableScrollToZoom");
const mousePanMode = useClientSettings("mousePanMode");
const invertAlt = useClientSettings("invertAlt");

enum TrackerMode {
    Absolute = "absolute",
    Relative = "relative",
}

const trackerModeOptions = Object.values(TrackerMode);

function setDefaultTrackerMode(event: Event): void {
    const mode = (event.target as HTMLSelectElement).value as TrackerMode;
    defaultTrackerMode.value = mode !== TrackerMode.Absolute;
}
</script>

<template>
    <div class="panel restore-panel">
        <div class="spanrow header">{{ t("game.ui.settings.client.BehaviourSettings.snapping") }}</div>
        <div class="row">
            <label for="invertAlt">{{ t("game.ui.settings.client.BehaviourSettings.invert_alt_set") }}</label>
            <div><input id="invertAlt" v-model="invertAlt" type="checkbox" /></div>
            <OverrideReset setting="invertAlt" />
        </div>
        <div class="spanrow header">{{ t("game.ui.settings.client.BehaviourSettings.mouse_gestures") }}</div>
        <div class="row">
            <label for="disableScrollToZoom">
                {{ t("game.ui.settings.client.BehaviourSettings.disable_scroll_to_zoom") }}
            </label>
            <div><input id="disableScrollToZoom" v-model="disableScrollToZoom" type="checkbox" /></div>
            <OverrideReset setting="disableScrollToZoom" />
        </div>
        <div class="row">
            <label for="mousePanMode">
                {{ t("game.ui.settings.client.BehaviourSettings.mouse_pan_mode") }}
            </label>
            <div>
                <select id="mousePanMode" v-model="mousePanMode">
                    <option
                        v-for="option in [0, 1, 2, 3]"
                        :key="option"
                        :value="option"
                        :label="t('game.ui.settings.client.BehaviourSettings.mouse_pan_mode_' + option)"
                        :selected="option === mousePanMode"
                    ></option>
                </select>
            </div>
            <OverrideReset setting="mousePanMode" />
        </div>
        <div class="spanrow header">{{ t("game.ui.settings.client.BehaviourSettings.selection_info") }}</div>
        <div class="row">
            <label for="defaultTrackerMode">
                {{ t("game.ui.settings.client.BehaviourSettings.selection_info_tracker_mode") }}
            </label>
            <div>
                <select @change="setDefaultTrackerMode">
                    <option
                        v-for="option in trackerModeOptions"
                        :key="option"
                        :value="option"
                        :label="t('game.ui.settings.client.BehaviourSettings.selection_info_tracker_mode_' + option)"
                        :selected="
                            defaultTrackerMode ? option === TrackerMode.Relative : option === TrackerMode.Absolute
                        "
                    ></option>
                </select>
            </div>
            <OverrideReset setting="defaultTrackerMode" />
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
