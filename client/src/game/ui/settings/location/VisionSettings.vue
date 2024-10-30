<script setup lang="ts">
import { computed, toRef } from "vue";
import { useI18n } from "vue-i18n";

import { getValue } from "../../../../core/utils";
import { gameSystem } from "../../../systems/game";
import { gameState } from "../../../systems/game/state";
import { locationSettingsState } from "../../../systems/settings/location/state";
import { uiState } from "../../../systems/ui/state";
import { VisibilityMode, visionState } from "../../../vision/state";

import ResetWrapper from "./ResetWrapper.vue";
import { useLocationSettings } from "./useLocationSettings";

const props = defineProps<{ global: boolean }>();
const { t } = useI18n();

const { reactive: $ } = locationSettingsState;

const visionMode = toRef(visionState.state, "mode");

const location = computed(() => (props.global ? undefined : uiState.reactive.openedLocationSettings));

const fakePlayer = computed({
    get() {
        return gameState.reactive.isFakePlayer;
    },
    set(isFakePlayer: boolean) {
        gameSystem.setFakePlayer(isFakePlayer);
    },
});

const fullFow = useLocationSettings("fullFow", location);

const fowLos = useLocationSettings("fowLos", location);

const fowOpacity = useLocationSettings("fowOpacity", location);

const visionMinRange = useLocationSettings("visionMinRange", location);

const visionMaxRange = useLocationSettings("visionMaxRange", location);

function changeVisionMode(event: Event): void {
    const value = getValue(event);
    let mode: VisibilityMode;
    if (value === t("game.ui.settings.VisionSettings.default")) mode = VisibilityMode.TRIANGLE;
    else if (value === t("game.ui.settings.VisionSettings.experimental")) mode = VisibilityMode.TRIANGLE_ITERATIVE;
    else return;
    visionState.setVisionMode(mode, true);
}
</script>

<template>
    <div class="panel restore-panel">
        <div class="spanrow">
            <template v-if="global">
                <em style="max-width: 40vw">
                    {{ t("game.ui.settings.common.overridden_msg") }}
                </em>
            </template>
            <template v-else>
                <i18n-t keypath="game.ui.settings.common.overridden_highlight_path" tag="span">
                    <span class="overwritten">{{ t("game.ui.settings.common.overridden_highlight") }}</span>
                </i18n-t>
            </template>
        </div>
        <div class="spanrow header">{{ t("game.ui.settings.VisionSettings.core") }}</div>
        <div v-if="global" class="row">
            <label for="fakePlayerInput">{{ t("game.ui.settings.VisionSettings.fake_player") }}</label>
            <div>
                <input id="fakePlayerInput" v-model="fakePlayer" type="checkbox" />
            </div>
            <div></div>
        </div>
        <ResetWrapper :global="global" :location="location" setting="fullFow">
            <label :for="'useFOWInput-' + location">{{ t("game.ui.settings.VisionSettings.fill_fow") }}</label>
            <div>
                <input :id="'useFOWInput-' + location" v-model="fullFow" type="checkbox" />
            </div>
        </ResetWrapper>
        <ResetWrapper :global="global" :location="location" setting="fowLos">
            <label :for="'fowLos-' + location">{{ t("game.ui.settings.VisionSettings.only_show_lights_los") }}</label>
            <div>
                <input :id="'fowLos-' + location" v-model="fowLos" type="checkbox" />
            </div>
        </ResetWrapper>
        <ResetWrapper :global="global" :location="location" setting="fowOpacity">
            <label :for="'fowOpacity-' + location">{{ t("game.ui.settings.VisionSettings.fow_opacity") }}</label>
            <div>
                <input
                    :id="'fowOpacity-' + location"
                    v-model.number="fowOpacity"
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                />
            </div>
        </ResetWrapper>
        <div class="spanrow header">{{ t("game.ui.settings.VisionSettings.advanced") }}</div>
        <div v-if="global" class="row">
            <label :for="'visionMode-' + location">{{ t("game.ui.settings.VisionSettings.vision_mode") }}</label>
            <div>
                <select :id="'visionMode-' + location" @change="changeVisionMode">
                    <option :selected="visionMode === 0">{{ t("game.ui.settings.VisionSettings.default") }}</option>
                    <option :selected="visionMode === 1">
                        {{ t("game.ui.settings.VisionSettings.experimental") }}
                    </option>
                </select>
            </div>
            <div></div>
        </div>
        <ResetWrapper :global="global" :location="location" setting="visionMinRange">
            <label :for="'vmininp-' + location">
                {{ t("game.ui.settings.VisionSettings.min_full_vision_UNIT", { unit: $.unitSizeUnit.value }) }}
            </label>
            <div>
                <input
                    :id="'vmininp-' + location"
                    v-model.lazy.number="visionMinRange"
                    type="number"
                    min="0"
                    :max="$.visionMaxRange.value"
                />
            </div>
        </ResetWrapper>
        <ResetWrapper :global="global" :location="location" setting="visionMaxRange">
            <label :for="'vmaxinp-' + location">
                {{ t("game.ui.settings.VisionSettings.max_vision_UNIT", { unit: $.unitSizeUnit.value }) }}
            </label>
            <div>
                <input
                    :id="'vmaxinp-' + location"
                    v-model.lazy.number="visionMaxRange"
                    type="number"
                    :min="Math.max(0, $.visionMinRange.value)"
                />
            </div>
        </ResetWrapper>
    </div>
</template>

<style scoped>
/* Force higher specificity without !important abuse */
.panel.restore-panel {
    grid-template-columns: [setting] 1fr [value] auto [restore] 30px [end];
}

.overwritten,
.restore-panel .row.overwritten * {
    color: #7c253e;
    font-weight: bold;
}
</style>
