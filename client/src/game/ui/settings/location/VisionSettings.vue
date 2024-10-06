<script setup lang="ts">
import { computed, toRef } from "vue";
import { useI18n } from "vue-i18n";

import { getValue } from "../../../../core/utils";
import { gameSystem } from "../../../systems/game";
import { gameState } from "../../../systems/game/state";
import { locationSettingsSystem } from "../../../systems/settings/location";
import { locationSettingsState } from "../../../systems/settings/location/state";
import { uiState } from "../../../systems/ui/state";
import { VisibilityMode, visionState } from "../../../vision/state";

const props = defineProps<{ global: boolean }>();
const { t } = useI18n();

const { reactive: $, getOption } = locationSettingsState;
const lss = locationSettingsSystem;

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

const fullFow = computed<boolean | undefined>({
    get() {
        return getOption($.fullFow, location.value).value;
    },
    set(fullFow: boolean | undefined) {
        lss.setFullFow(fullFow, location.value, true);
    },
});

const fowLos = computed<boolean | undefined>({
    get() {
        return getOption($.fowLos, location.value).value;
    },
    set(fowLos: boolean | undefined) {
        lss.setFowLos(fowLos, location.value, true);
    },
});

const fowOpacity = computed<number | undefined>({
    get() {
        return getOption($.fowOpacity, location.value).value;
    },
    set(fowOpacity: number | undefined) {
        lss.setFowOpacity(fowOpacity, location.value, true);
    },
});

const visionMinRange = computed<number | undefined>({
    get() {
        return getOption($.visionMinRange, location.value).value;
    },
    set(newMin: number | undefined) {
        if (newMin !== undefined && visionMaxRange.value !== undefined && newMin > visionMaxRange.value) {
            newMin = visionMaxRange.value;
        }
        lss.setVisionMinRange(newMin, location.value, true);
    },
});

const visionMaxRange = computed<number | undefined>({
    get() {
        return getOption($.visionMaxRange, location.value).value;
    },
    set(newMax: number | undefined) {
        if (newMax !== undefined && visionMinRange.value !== undefined && newMax < visionMinRange.value) {
            newMax = visionMinRange.value;
        }
        lss.setVisionMaxRange(newMax, location.value, true);
    },
});

function changeVisionMode(event: Event): void {
    const value = getValue(event);
    let mode: VisibilityMode;
    if (value === t("game.ui.settings.VisionSettings.default")) mode = VisibilityMode.TRIANGLE;
    else if (value === t("game.ui.settings.VisionSettings.experimental")) mode = VisibilityMode.TRIANGLE_ITERATIVE;
    else return;
    visionState.setVisionMode(mode, true);
}

function o(k: any): boolean {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return getOption(k, location.value).override !== undefined;
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
        <div class="row" :class="{ overwritten: !global && o($.fullFow) }">
            <label :for="'useFOWInput-' + location">{{ t("game.ui.settings.VisionSettings.fill_fow") }}</label>
            <div>
                <input :id="'useFOWInput-' + location" v-model="fullFow" type="checkbox" />
            </div>
            <div
                v-if="!global && o($.fullFow)"
                :title="t('game.ui.settings.common.reset_default')"
                @click="fullFow = undefined"
            >
                <font-awesome-icon icon="times-circle" />
            </div>
            <div v-else></div>
        </div>
        <div class="row" :class="{ overwritten: !global && o($.fowLos) }">
            <label :for="'fowLos-' + location">{{ t("game.ui.settings.VisionSettings.only_show_lights_los") }}</label>
            <div>
                <input :id="'fowLos-' + location" v-model="fowLos" type="checkbox" />
            </div>
            <div
                v-if="!global && o($.fowLos)"
                :title="t('game.ui.settings.common.reset_default')"
                @click="fowLos = undefined"
            >
                <font-awesome-icon icon="times-circle" />
            </div>
            <div v-else></div>
        </div>
        <div class="row" :class="{ overwritten: !global && o($.fowOpacity) }">
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
            <div
                v-if="!global && o($.fowOpacity)"
                :title="t('game.ui.settings.common.reset_default')"
                @click="fowOpacity = undefined"
            >
                <font-awesome-icon icon="times-circle" />
            </div>
            <div v-else></div>
        </div>
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
        <div class="row" :class="{ overwritten: !global && o($.visionMinRange) }">
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
            <div
                v-if="!global && o($.visionMinRange)"
                :title="t('game.ui.settings.common.reset_default')"
                @click="visionMinRange = undefined"
            >
                <font-awesome-icon icon="times-circle" />
            </div>
            <div v-else></div>
        </div>
        <div class="row" :class="{ overwritten: !global && o($.visionMaxRange) }">
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
            <div
                v-if="!global && o($.visionMaxRange)"
                :title="t('game.ui.settings.common.reset_default')"
                @click="visionMaxRange = undefined"
            >
                <font-awesome-icon icon="times-circle" />
            </div>
            <div v-else></div>
        </div>
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
