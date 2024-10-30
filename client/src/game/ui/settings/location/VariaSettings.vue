<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import { uiState } from "../../../systems/ui/state";

import ResetWrapper from "./ResetWrapper.vue";
import { useLocationSettings } from "./useLocationSettings";

const props = defineProps<{ global: boolean }>();

const { t } = useI18n();

const location = computed(() => (props.global ? undefined : uiState.reactive.openedLocationSettings));

const movePlayerOnTokenChange = useLocationSettings("movePlayerOnTokenChange", location);
const limitMovementDuringInitiative = useLocationSettings("limitMovementDuringInitiative", location);
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
        <ResetWrapper :global="global" :location="location" setting="movePlayerOnTokenChange">
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
        </ResetWrapper>
        <ResetWrapper :global="global" :location="location" setting="limitMovementDuringInitiative">
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
