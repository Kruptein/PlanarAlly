<script setup lang="ts">
import { type Component, computed } from "vue";
import { useI18n } from "vue-i18n";

import PanelModal from "../../../../core/components/modals/PanelModal.vue";
import { uiSystem } from "../../../systems/ui";
import { uiState } from "../../../systems/ui/state";

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

const tabs: { name: string; component: Component }[] = [{ name: t(LgSettingCategory.Grid), component: LgGridSettings }];
</script>

<template>
    <PanelModal v-model:visible="visible" :tabs="tabs">
        <template #title>{{ t("game.ui.settings.lg.LgSettings.title") }}</template>
    </PanelModal>
</template>
