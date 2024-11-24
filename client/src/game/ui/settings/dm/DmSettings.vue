<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import PanelModal from "../../../../core/components/modals/PanelModal.vue";
import type { ModalIndex } from "../../../systems/modals/types";
import { uiSystem } from "../../../systems/ui";
import { uiState } from "../../../systems/ui/state";
import FloorSettings from "../location/FloorSettings.vue";
import GridSettings from "../location/GridSettings.vue";
import VariaSettings from "../location/VariaSettings.vue";
import VisionSettings from "../location/VisionSettings.vue";

import AdminSettings from "./AdminSettings.vue";
import { DmSettingCategory } from "./categories";
import FeatureSettings from "./FeatureSettings.vue";

const emit = defineEmits<(e: "close" | "focus") => void>();
defineProps<{ modalIndex: ModalIndex }>();

const { t } = useI18n();

const visible = computed({
    get() {
        return uiState.reactive.showDmSettings;
    },
    set(visible: boolean) {
        uiSystem.showDmSettings(visible);
    },
});

function close(): void {
    visible.value = false;
    emit("close");
}
defineExpose({ close });

// Computed to trigger locale rerender
const tabs = computed(() => [
    {
        category: DmSettingCategory.Admin,
        name: t(DmSettingCategory.Admin),
        component: AdminSettings,
        props: { global: true },
    },
    {
        category: DmSettingCategory.Features,
        name: t(DmSettingCategory.Features),
        component: FeatureSettings,
        props: { global: true },
    },
    {
        category: DmSettingCategory.Grid,
        name: t(DmSettingCategory.Grid),
        component: GridSettings,
        props: { global: true },
    },
    {
        category: DmSettingCategory.Vision,
        name: t(DmSettingCategory.Vision),
        component: VisionSettings,
        props: { global: true },
    },
    {
        category: DmSettingCategory.Floor,
        name: t(DmSettingCategory.Floor),
        component: FloorSettings,
        props: { global: true },
    },
    {
        category: DmSettingCategory.Varia,
        name: t(DmSettingCategory.Varia),
        component: VariaSettings,
        props: { global: true },
    },
]);
</script>

<template>
    <PanelModal v-model:visible="visible" :tabs="tabs" @focus="$emit('focus')" @close="close">
        <template #title>{{ t("game.ui.settings.dm.DmSettings.dm_settings") }}</template>
    </PanelModal>
</template>
