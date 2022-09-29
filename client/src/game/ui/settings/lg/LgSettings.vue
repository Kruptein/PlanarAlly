<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import PanelModal from "../../../../core/components/modals/PanelModal.vue";
import { uiStore } from "../../../../store/ui";

import { LgSettingCategory } from "./categories";
import LgGridSettings from "./LgGridSettings.vue";

const { t } = useI18n();

const visible = computed({
    get() {
        return uiStore.state.showLgSettings;
    },
    set(visible: boolean) {
        uiStore.showLgSettings(visible);
    },
});

const categoryNames = [LgSettingCategory.Grid];
</script>

<template>
    <PanelModal v-model:visible="visible" :categories="categoryNames" :applyTranslation="true">
        <template v-slot:title>{{ t("game.ui.settings.lg.LgSettings.title") }}</template>
        <template v-slot:default="{ selection }">
            <LgGridSettings :visible="visible && selection === LgSettingCategory.Grid" />
        </template>
    </PanelModal>
</template>
