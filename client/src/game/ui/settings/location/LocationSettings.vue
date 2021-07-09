<script setup lang="ts">
import { computed, toRef } from "vue";
import { useI18n } from "vue-i18n";

import PanelModal from "../../../../core/components/modals/PanelModal.vue";
import { locationStore } from "../../../../store/location";
import { uiStore } from "../../../../store/ui";
import FloorSettings from "../location/FloorSettings.vue";
import GridSettings from "../location/GridSettings.vue";
import VariaSettings from "../location/VariaSettings.vue";
import VisionSettings from "../location/VisionSettings.vue";

import AdminSettings from "./AdminSettings.vue";
import { LocationSettingCategory } from "./categories";

const { t } = useI18n();

const location = toRef(uiStore.state, "openedLocationSettings");

const visible = computed({
    get() {
        return location.value >= 0;
    },
    set(visible: boolean) {
        if (!visible) uiStore.showLocationSettings(-1);
    },
});

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
    <PanelModal v-if="location >= 0" v-model:visible="visible" :categories="categoryNames" :applyTranslation="true">
        <template v-slot:title>
            {{ t("game.ui.settings.LocationBar.LocationSettings.location_settings") }} {{ locationName }}
        </template>
        <template v-slot:default="{ selection }">
            <AdminSettings
                :location="location"
                v-show="selection === LocationSettingCategory.Admin"
                @close="visible = false"
            />
            <GridSettings :location="location" v-show="selection === LocationSettingCategory.Grid" />
            <VisionSettings :location="location" v-show="selection === LocationSettingCategory.Vision" />
            <FloorSettings :location="location" v-show="selection === LocationSettingCategory.Floor" />
            <VariaSettings :location="location" v-show="selection === LocationSettingCategory.Varia" />
        </template>
    </PanelModal>
</template>
