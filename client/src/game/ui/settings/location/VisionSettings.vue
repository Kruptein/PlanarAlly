<script setup lang="ts">
import { computed, ref, toRef } from "vue";
import { useI18n } from "vue-i18n";

import { getValue } from "../../../../core/utils";
import { getGameState } from "../../../../store/_game";
import { gameStore } from "../../../../store/game";
import { locationSettingsSystem } from "../../../systems/settings/location";
import { locationSettingsState } from "../../../systems/settings/location/state";
import { VisibilityMode, visionState } from "../../../vision/state";

const props = withDefaults(defineProps<{ location?: number }>(), { location: -1 });
const { t } = useI18n();

const { reactive: $, getOption } = locationSettingsState;
const lss = locationSettingsSystem;

const visionMode = toRef(visionState.state, "mode");

const isGlobal = computed(() => props.location < 0);
const location = computed(() => (isGlobal.value ? undefined : props.location));

// TODO: Clean up this hack around locationSettingsState not being reactive when setting things
const invalidateHack = ref(0);

const fakePlayer = computed({
    get() {
        return getGameState().isFakePlayer;
    },
    set(isFakePlayer: boolean) {
        gameStore.setFakePlayer(isFakePlayer);
    },
});

const fullFow = computed({
    get() {
        return getOption($.fullFow, location.value).value;
    },
    set(fullFow: boolean | undefined) {
        lss.setFullFow(fullFow, location.value, true);
    },
});

const fowLos = computed({
    get() {
        return getOption($.fowLos, location.value).value;
    },
    set(fowLos: boolean | undefined) {
        lss.setFowLos(fowLos, location.value, true);
    },
});

const fowOpacity = computed({
    get() {
        return getOption($.fowOpacity, location.value).value;
    },
    set(fowOpacity: number | undefined) {
        lss.setFowOpacity(fowOpacity, location.value, true);
    },
});

const visionMinRange = computed({
    get() {
        invalidateHack.value;
        return getOption($.visionMinRange, location.value).value;
    },
    set(newMin: number | undefined) {
        if (newMin !== undefined && visionMaxRange.value !== undefined && newMin > visionMaxRange.value) {
            newMin = visionMaxRange.value;
            invalidateHack.value++;
        }
        lss.setVisionMinRange(newMin, location.value, true);
    },
});

const visionMaxRange = computed({
    get() {
        invalidateHack.value;
        return getOption($.visionMaxRange, location.value).value;
    },
    set(newMax: number | undefined) {
        if (newMax !== undefined && visionMinRange.value !== undefined && newMax < visionMinRange.value) {
            newMax = visionMinRange.value;
            invalidateHack.value++;
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
    return getOption(k, location.value).override !== undefined;
}
</script>

<template>
    <div class="panel restore-panel">
        <div class="spanrow">
            <template v-if="isGlobal">
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
        <div class="row" v-if="isGlobal">
            <label for="fakePlayerInput">{{ t("game.ui.settings.VisionSettings.fake_player") }}</label>
            <div>
                <input id="fakePlayerInput" type="checkbox" v-model="fakePlayer" />
            </div>
            <div></div>
        </div>
        <div class="row" :class="{ overwritten: !isGlobal && o($.fullFow) }">
            <label :for="'useFOWInput-' + location">{{ t("game.ui.settings.VisionSettings.fill_fow") }}</label>
            <div>
                <input :id="'useFOWInput-' + location" type="checkbox" v-model="fullFow" />
            </div>
            <div
                v-if="!isGlobal && o($.fullFow)"
                @click="fullFow = undefined"
                :title="t('game.ui.settings.common.reset_default')"
            >
                <font-awesome-icon icon="times-circle" />
            </div>
            <div v-else></div>
        </div>
        <div class="row" :class="{ overwritten: !isGlobal && o($.fowLos) }">
            <label :for="'fowLos-' + location">{{ t("game.ui.settings.VisionSettings.only_show_lights_los") }}</label>
            <div>
                <input :id="'fowLos-' + location" type="checkbox" v-model="fowLos" />
            </div>
            <div
                v-if="!isGlobal && o($.fowLos)"
                @click="fowLos = undefined"
                :title="t('game.ui.settings.common.reset_default')"
            >
                <font-awesome-icon icon="times-circle" />
            </div>
            <div v-else></div>
        </div>
        <div class="row" :class="{ overwritten: !isGlobal && o($.fowOpacity) }">
            <label :for="'fowOpacity-' + location">{{ t("game.ui.settings.VisionSettings.fow_opacity") }}</label>
            <div>
                <input
                    :id="'fowOpacity-' + location"
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    v-model.number="fowOpacity"
                />
            </div>
            <div
                v-if="!isGlobal && o($.fowOpacity)"
                @click="fowOpacity = undefined"
                :title="t('game.ui.settings.common.reset_default')"
            >
                <font-awesome-icon icon="times-circle" />
            </div>
            <div v-else></div>
        </div>
        <div class="spanrow header">{{ t("game.ui.settings.VisionSettings.advanced") }}</div>
        <div class="row" v-if="isGlobal">
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
        <div class="row" :class="{ overwritten: !isGlobal && o($.visionMinRange) }">
            <label :for="'vmininp-' + location">
                {{ t("game.ui.settings.VisionSettings.min_full_vision_UNIT", { unit: $.unitSizeUnit.value }) }}
            </label>
            <div>
                <input
                    :id="'vmininp-' + location"
                    type="number"
                    min="0"
                    :max="$.visionMaxRange.value"
                    v-model.lazy.number="visionMinRange"
                />
            </div>
            <div
                v-if="!isGlobal && o($.visionMinRange)"
                @click="visionMinRange = undefined"
                :title="t('game.ui.settings.common.reset_default')"
            >
                <font-awesome-icon icon="times-circle" />
            </div>
            <div v-else></div>
        </div>
        <div class="row" :class="{ overwritten: !isGlobal && o($.visionMaxRange) }">
            <label :for="'vmaxinp-' + location">
                {{ t("game.ui.settings.VisionSettings.max_vision_UNIT", { unit: $.unitSizeUnit.value }) }}
            </label>
            <div>
                <input
                    :id="'vmaxinp-' + location"
                    type="number"
                    :min="Math.max(0, $.visionMinRange.value)"
                    v-model.lazy.number="visionMaxRange"
                />
            </div>
            <div
                v-if="!isGlobal && o($.visionMaxRange)"
                @click="visionMaxRange = undefined"
                :title="t('game.ui.settings.common.reset_default')"
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
