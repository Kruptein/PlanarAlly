<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import PanelModal from "../../../../core/components/modals/PanelModal.vue";
import { uiSystem } from "../../../systems/ui";
import { uiState } from "../../../systems/ui/state";

import AppearanceSettings from "./AppearanceSettings.vue";
import BehaviourSettings from "./BehaviourSettings.vue";
import { ClientSettingCategory } from "./categories";
import DisplaySettings from "./DisplaySettings.vue";
import InitiativeSettings from "./InitiativeSettings.vue";
import PerformanceSettings from "./PerformanceSettings.vue";

const { t } = useI18n();

const visible = computed({
    get() {
        return uiState.reactive.showClientSettings;
    },
    set(visible: boolean) {
        uiSystem.showClientSettings(visible);
    },
});

function close(): void {
    visible.value = false;
}

defineExpose({ close });
const categoryNames = [
    ClientSettingCategory.Appearance,
    ClientSettingCategory.Behaviour,
    ClientSettingCategory.Display,
    ClientSettingCategory.Initiative,
    ClientSettingCategory.Performance,
];
</script>

<template>
    <PanelModal
        v-model:visible="visible"
        :categories="categoryNames"
        :initialSelection="uiState.reactive.clientSettingsTab"
    >
        <template v-slot:title>{{ t("game.ui.settings.client.ClientSettings.client_settings") }}</template>
        <template v-slot:default="{ selection }">
            <AppearanceSettings v-show="selection === ClientSettingCategory.Appearance" />
            <DisplaySettings v-show="selection === ClientSettingCategory.Display" />
            <BehaviourSettings v-show="selection === ClientSettingCategory.Behaviour" />
            <InitiativeSettings v-show="selection === ClientSettingCategory.Initiative" />
            <PerformanceSettings v-show="selection === ClientSettingCategory.Performance" />
        </template>
    </PanelModal>
</template>
