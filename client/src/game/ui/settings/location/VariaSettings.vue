<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import { locationSettingsSystem } from "../../../systems/settings/location";
import { locationSettingsState } from "../../../systems/settings/location/state";
import { uiState } from "../../../systems/ui/state";

const props = defineProps<{ global: boolean }>();

const { t } = useI18n();

const location = computed(() => (props.global ? undefined : uiState.reactive.openedLocationSettings));

const { reactive: $, getOption } = locationSettingsState;
const lss = locationSettingsSystem;

const movePlayerOnTokenChange = computed<boolean | undefined>({
    get() {
        return getOption($.movePlayerOnTokenChange, location.value).value;
    },
    set(movePlayerOnTokenChange: boolean | undefined) {
        lss.setMovePlayerOnTokenChange(movePlayerOnTokenChange, location.value, true);
    },
});

const limitMovementDuringInitiative = computed<boolean | undefined>({
    get() {
        return getOption($.limitMovementDuringInitiative, location.value).value;
    },
    set(limitMovementDuringInitiative: boolean | undefined) {
        lss.setLimitMovementDuringInitiative(limitMovementDuringInitiative, location.value, true);
    },
});

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
        <div class="row" :class="{ overwritten: !global && o($.movePlayerOnTokenChange) }">
            <label :for="'movePlayerOnTokenChangeInput-' + location">
                {{ t("game.ui.settings.VariaSettings.movePlayerOnTokenChange") }}
            </label>
            <div>
                <input
                    :id="'movePlayerOnTokenChangeInput-' + location"
                    v-model="movePlayerOnTokenChange"
                    type="checkbox"
                />
            </div>
            <div
                v-if="!global && o($.movePlayerOnTokenChange)"
                :title="t('game.ui.settings.common.reset_default')"
                @click="movePlayerOnTokenChange = undefined"
            >
                <font-awesome-icon icon="times-circle" />
            </div>
            <div v-else></div>
        </div>
        <div class="row" :class="{ overwritten: !global && o($.limitMovementDuringInitiative) }">
            <label :for="'limitMovementDuringInitiativeInput-' + location">
                {{ t("game.ui.settings.VariaSettings.limitMovementDuringInitiative") }}
            </label>
            <div>
                <input
                    :id="'limitMovementDuringInitiativeInput-' + location"
                    v-model="limitMovementDuringInitiative"
                    type="checkbox"
                />
            </div>
            <div
                v-if="!global && o($.limitMovementDuringInitiative)"
                :title="t('game.ui.settings.common.reset_default')"
                @click="limitMovementDuringInitiative = undefined"
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
