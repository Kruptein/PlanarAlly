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
        id: ClientSettingCategory.Appearance,
        label: t("game.ui.settings.client.common.Appearance"),
        component: AppearanceSettings,
    },
    {
        id: ClientSettingCategory.Behaviour,
        label: t("game.ui.settings.client.common.Behaviour"),
        component: BehaviourSettings,
    },
    {
        id: ClientSettingCategory.Display,
        label: t("game.ui.settings.client.common.Display"),
        component: DisplaySettings,
    },
    { id: ClientSettingCategory.Initiative, label: t("common.initiative"), component: InitiativeSettings },
    {
        id: ClientSettingCategory.Performance,
        label: t("game.ui.settings.client.common.Performance"),
        component: PerformanceSettings,
    },
]);
</script>

<template>
    <PanelModal v-model:visible="visible" v-model:selection="uiState.reactive.clientSettingsTab" :tabs="tabs">
        <template #title>{{ t("game.ui.settings.client.ClientSettings.client_settings") }}</template>
    </PanelModal>
</template>
