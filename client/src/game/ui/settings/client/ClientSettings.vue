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

// Computed to trigger locale rerender
const tabs = computed(() => [
    {
        category: ClientSettingCategory.Appearance,
        name: t("game.ui.settings.client.common.Appearance"),
        component: AppearanceSettings,
    },
    {
        category: ClientSettingCategory.Behaviour,
        name: t("game.ui.settings.client.common.Behaviour"),
        component: BehaviourSettings,
    },
    {
        category: ClientSettingCategory.Display,
        name: t("game.ui.settings.client.common.Display"),
        component: DisplaySettings,
    },
    { category: ClientSettingCategory.Initiative, name: t("common.initiative"), component: InitiativeSettings },
    {
        category: ClientSettingCategory.Performance,
        name: t("game.ui.settings.client.common.Performance"),
        component: PerformanceSettings,
    },
]);
</script>

<template>
    <PanelModal v-model:visible="visible" :tabs="tabs" :initial-selection="uiState.reactive.clientSettingsTab">
        <template #title>{{ t("game.ui.settings.client.ClientSettings.client_settings") }}</template>
    </PanelModal>
</template>
