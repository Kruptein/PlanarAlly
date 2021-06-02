<script lang="ts">
import { computed, defineComponent, toRef } from "vue";
import { useI18n } from "vue-i18n";

import PanelModal from "../../../../core/components/modals/PanelModal.vue";
import { uiStore } from "../../../../store/ui";

import AppearanceSettings from "./AppearanceSettings.vue";
import BehaviourSettings from "./BehaviourSettings.vue";
import { ClientSettingCategory } from "./categories";
import DisplaySettings from "./DisplaySettings.vue";
import InitiativeSettings from "./InitiativeSettings.vue";

export default defineComponent({
    components: { AppearanceSettings, BehaviourSettings, DisplaySettings, InitiativeSettings, PanelModal },
    setup() {
        const { t } = useI18n();

        const visible = computed({
            get() {
                return uiStore.state.showClientSettings;
            },
            set(visible: boolean) {
                uiStore.showClientSettings(visible);
            },
        });

        const categoryNames = [
            ClientSettingCategory.Appearance,
            ClientSettingCategory.Behaviour,
            ClientSettingCategory.Display,
            ClientSettingCategory.Initiative,
        ];

        return {
            activeClientTab: toRef(uiStore.state, "clientSettingsTab"),
            ClientSettingCategory,
            categoryNames,
            visible,
            t,
        };
    },
});
</script>

<template>
    <PanelModal v-model:visible="visible" :categories="categoryNames" :initialSelection="activeClientTab">
        <template v-slot:title>{{ t("game.ui.settings.client.ClientSettings.client_settings") }}</template>
        <template v-slot:default="{ selection }">
            <AppearanceSettings v-show="selection === ClientSettingCategory.Appearance" />
            <DisplaySettings v-show="selection === ClientSettingCategory.Display" />
            <BehaviourSettings v-show="selection === ClientSettingCategory.Behaviour" />
            <InitiativeSettings v-show="selection === ClientSettingCategory.Initiative" />
        </template>
    </PanelModal>
</template>
