<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import { playerSettingsSystem } from "../../../systems/settings/players";
import { playerSettingsState } from "../../../systems/settings/players/state";

const { t } = useI18n();

const { reactive: $ } = playerSettingsState;
const pss = playerSettingsSystem;

const invertAlt = computed<boolean | undefined>({
    get() {
        return $.invertAlt.value;
    },
    set(invertAlt: boolean | undefined) {
        pss.setInvertAlt(invertAlt, { sync: true });
    },
});

const disableScrollToZoom = computed<boolean | undefined>({
    get() {
        return $.disableScrollToZoom.value;
    },
    set(disableScrollToZoom: boolean | undefined) {
        pss.setDisableScrollToZoom(disableScrollToZoom, { sync: true });
    },
});

const defaultTrackerMode = computed<boolean | undefined>({
    get() {
        return $.defaultTrackerMode.value;
    },
    set(defaultTrackerMode: boolean | undefined) {
        pss.setDefaultTrackerMode(defaultTrackerMode, { sync: true });
    },
});

enum TrackerMode {
    Absolute = "absolute",
    Relative = "relative",
}

const trackerModeOptions = Object.values(TrackerMode);

function setDefaultTrackerMode(event: Event): void {
    const mode = (event.target as HTMLSelectElement).value as TrackerMode;
    defaultTrackerMode.value = mode !== TrackerMode.Absolute;
}

const mousePanMode = computed<number | undefined>({
    get() {
        return $.mousePanMode.value;
    },
    set(mousePanMode: number | undefined) {
        pss.setMousePanMode(mousePanMode, { sync: true });
    },
});
</script>

<template>
    <div class="panel restore-panel">
        <div class="spanrow header">Snapping</div>
        <div class="row">
            <label for="invertAlt">{{ t("game.ui.settings.client.BehaviourSettings.invert_alt_set") }}</label>
            <div><input id="invertAlt" v-model="invertAlt" type="checkbox" /></div>
            <template v-if="$.invertAlt.override !== undefined">
                <div :title="t('game.ui.settings.common.reset_default')" @click="invertAlt = undefined">
                    <font-awesome-icon icon="times-circle" />
                </div>
                <div
                    :title="t('game.ui.settings.common.sync_default')"
                    @click="pss.setInvertAlt(undefined, { sync: true, default: $.invertAlt.override })"
                >
                    <font-awesome-icon icon="sync-alt" />
                </div>
            </template>
        </div>
        <div class="spanrow header">Mouse & Gestures</div>
        <div class="row">
            <label for="disableScrollToZoom">
                {{ t("game.ui.settings.client.BehaviourSettings.disable_scroll_to_zoom") }}
            </label>
            <div><input id="disableScrollToZoom" v-model="disableScrollToZoom" type="checkbox" /></div>
            <template v-if="$.disableScrollToZoom.override !== undefined">
                <div :title="t('game.ui.settings.common.reset_default')" @click="disableScrollToZoom = undefined">
                    <font-awesome-icon icon="times-circle" />
                </div>
                <div
                    :title="t('game.ui.settings.common.sync_default')"
                    @click="
                        pss.setDisableScrollToZoom(undefined, { sync: true, default: $.disableScrollToZoom.override })
                    "
                >
                    <font-awesome-icon icon="sync-alt" />
                </div>
            </template>
            <label for="mousePanMode">
                {{ t("game.ui.settings.client.BehaviourSettings.mouse_pan_mode") }}
            </label>
            <div>
                <select v-model="mousePanMode">
                    <option
                        v-for="option in [0, 1, 2, 3]"
                        :key="option"
                        :value="option"
                        :label="t('game.ui.settings.client.BehaviourSettings.mouse_pan_mode_' + option)"
                        :selected="option === mousePanMode"
                    ></option>
                </select>
            </div>
            <template v-if="$.mousePanMode.override !== undefined">
                <div :title="t('game.ui.settings.common.reset_default')" @click="mousePanMode = undefined">
                    <font-awesome-icon icon="times-circle" />
                </div>
                <div
                    :title="t('game.ui.settings.common.sync_default')"
                    @click="pss.setMousePanMode(undefined, { sync: true, default: $.mousePanMode.override })"
                >
                    <font-awesome-icon icon="sync-alt" />
                </div>
            </template>
        </div>
        <div class="spanrow header">Selection Info</div>
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
            <template v-if="$.defaultTrackerMode.override !== undefined">
                <div :title="t('game.ui.settings.common.reset_default')" @click="defaultTrackerMode = undefined">
                    <font-awesome-icon icon="times-circle" />
                </div>
                <div
                    :title="t('game.ui.settings.common.sync_default')"
                    @click="
                        pss.setDefaultTrackerMode(undefined, { sync: true, default: $.defaultTrackerMode.override })
                    "
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
