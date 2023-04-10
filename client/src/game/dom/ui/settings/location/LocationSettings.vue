<script setup lang="ts">
import { computed, toRef } from "vue";
import { useI18n } from "vue-i18n";

import PanelModal from "../../../../../core/components/modals/PanelModal.vue";
import { locationStore } from "../../../../../store/location";
import { uiSystem } from "../../../../core/systems/ui";
import { uiState } from "../../../../core/systems/ui/state";
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

const categoryNames = [
    LocationSettingCategory.Admin,
    LocationSettingCategory.Grid,
    LocationSettingCategory.Vision,
    LocationSettingCategory.Floor,
    LocationSettingCategory.Varia,
];
</script>

<template>
    <PanelModal v-if="location >= 0" v-model:visible="visible" :categories="categoryNames" :apply-translation="true">
        <template #title>
            {{ t("game.ui.settings.LocationBar.LocationSettings.location_settings") }} {{ locationName }}
        </template>
        <template #default="{ selection }">
            <AdminSettings
                v-show="selection === LocationSettingCategory.Admin"
                :location="location"
                @close="visible = false"
            />
            <GridSettings v-show="selection === LocationSettingCategory.Grid" :location="location" />
            <VisionSettings v-show="selection === LocationSettingCategory.Vision" :location="location" />
            <FloorSettings v-show="selection === LocationSettingCategory.Floor" :location="location" />
            <VariaSettings v-show="selection === LocationSettingCategory.Varia" :location="location" />
        </template>
    </PanelModal>
</template>
