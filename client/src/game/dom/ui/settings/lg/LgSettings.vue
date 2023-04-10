<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import PanelModal from "../../../../../core/components/modals/PanelModal.vue";
import { uiSystem } from "../../../../core/systems/ui";
import { uiState } from "../../../../core/systems/ui/state";

import { LgSettingCategory } from "./categories";
import LgGridSettings from "./LgGridSettings.vue";

const { t } = useI18n();

const visible = computed({
    get() {
        return uiState.reactive.showLgSettings;
    },
    set(visible: boolean) {
        uiSystem.showLgSettings(visible);
    },
});

function close(): void {
    visible.value = false;
}
defineExpose({ close });

const categoryNames = [LgSettingCategory.Grid];
</script>

<template>
    <PanelModal v-model:visible="visible" :categories="categoryNames" :apply-translation="true">
        <template #title>{{ t("game.ui.settings.lg.LgSettings.title") }}</template>
        <template #default="{ selection }">
            <LgGridSettings :visible="visible && selection === LgSettingCategory.Grid" />
        </template>
    </PanelModal>
</template>
