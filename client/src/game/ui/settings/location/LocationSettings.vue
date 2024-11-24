<script setup lang="ts">
import { computed, toRef } from "vue";
import { useI18n } from "vue-i18n";

import PanelModal from "../../../../core/components/modals/PanelModal.vue";
import { locationStore } from "../../../../store/location";
import { uiSystem } from "../../../systems/ui";
import { uiState } from "../../../systems/ui/state";
import FloorSettings from "../location/FloorSettings.vue";
import GridSettings from "../location/GridSettings.vue";
import VariaSettings from "../location/VariaSettings.vue";
import VisionSettings from "../location/VisionSettings.vue";

import AdminSettings from "./AdminSettings.vue";
import { LocationSettingCategory } from "./categories";

const { t } = useI18n();

const location = toRef(uiState.reactive, "openedLocationSettings");

const visible = computed({
    get() {
        return location.value >= 0;
    },
    set(visible: boolean) {
        if (!visible) uiSystem.showLocationSettings(-1);
    },
});

function close(): void {
    visible.value = false;
}
defineExpose({ close });

const locationName = computed(
    () => locationStore.activeLocations.value.find((l) => l.id === location.value)?.name ?? "",
);

// Computed to trigger locale rerender
const tabs = computed(() => [
    {
        category: LocationSettingCategory.Admin,
        name: t(LocationSettingCategory.Admin),
        component: AdminSettings,
        props: { global: false },
    },
    {
        category: LocationSettingCategory.Grid,
        name: t(LocationSettingCategory.Grid),
        component: GridSettings,
        props: { global: false },
    },
    {
        category: LocationSettingCategory.Vision,
        name: t(LocationSettingCategory.Vision),
        component: VisionSettings,
        props: { global: false },
    },
    {
        category: LocationSettingCategory.Floor,
        name: t(LocationSettingCategory.Floor),
        component: FloorSettings,
        props: { global: false },
    },
    {
        category: LocationSettingCategory.Varia,
        name: t(LocationSettingCategory.Varia),
        component: VariaSettings,
        props: { global: false },
    },
]);
</script>

<template>
    <PanelModal v-if="location >= 0" v-model:visible="visible" :tabs="tabs">
        <template #title>
            {{ t("game.ui.settings.LocationBar.LocationSettings.location_settings") }} {{ locationName }}
        </template>
    </PanelModal>
</template>
