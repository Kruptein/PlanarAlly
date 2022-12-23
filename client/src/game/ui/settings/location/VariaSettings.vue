<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import { locationSettingsSystem } from "../../../systems/settings/location";
import { locationSettingsState } from "../../../systems/settings/location/state";

const props = withDefaults(defineProps<{ location?: number }>(), { location: -1 });

const { t } = useI18n();

const isGlobal = computed(() => props.location < 0);
const location = computed(() => (isGlobal.value ? undefined : props.location));

const { reactive: $, getOption } = locationSettingsState;
const lss = locationSettingsSystem;

const movePlayerOnTokenChange = computed({
    get() {
        return getOption($.movePlayerOnTokenChange, location.value).value;
    },
    set(movePlayerOnTokenChange: boolean | undefined) {
        lss.setMovePlayerOnTokenChange(movePlayerOnTokenChange, location.value, true);
    },
});

const limitMovementDuringInitiative = computed({
    get() {
        return getOption($.limitMovementDuringInitiative, location.value).value;
    },
    set(limitMovementDuringInitiative: boolean | undefined) {
        lss.setLimitMovementDuringInitiative(limitMovementDuringInitiative, location.value, true);
    },
});

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
        <div class="row" :class="{ overwritten: !isGlobal && o($.movePlayerOnTokenChange) }">
            <label :for="'movePlayerOnTokenChangeInput-' + location">
                {{ t("game.ui.settings.VariaSettings.movePlayerOnTokenChange") }}
            </label>
            <div>
                <input
                    :id="'movePlayerOnTokenChangeInput-' + location"
                    type="checkbox"
                    v-model="movePlayerOnTokenChange"
                />
            </div>
            <div
                v-if="!isGlobal && o($.movePlayerOnTokenChange)"
                @click="movePlayerOnTokenChange = undefined"
                :title="t('game.ui.settings.common.reset_default')"
            >
                <font-awesome-icon icon="times-circle" />
            </div>
            <div v-else></div>
        </div>
        <div class="row" :class="{ overwritten: !isGlobal && o($.limitMovementDuringInitiative) }">
            <label :for="'limitMovementDuringInitiativeInput-' + location">
                {{ t("game.ui.settings.VariaSettings.limitMovementDuringInitiative") }}
            </label>
            <div>
                <input
                    :id="'limitMovementDuringInitiativeInput-' + location"
                    type="checkbox"
                    v-model="limitMovementDuringInitiative"
                />
            </div>
            <div
                v-if="!isGlobal && o($.limitMovementDuringInitiative)"
                @click="limitMovementDuringInitiative = undefined"
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
