<script lang="ts">
import { computed, defineComponent, toRef } from "vue";
import { useI18n } from "vue-i18n";

import PanelModal from "../../../../core/components/modals/PanelModal.vue";
import { locationStore } from "../../../../store/location";
import { uiStore } from "../../../../store/ui";
import GridSettings from "../location/GridSettings.vue";
import VariaSettings from "../location/VariaSettings.vue";
import VisionSettings from "../location/VisionSettings.vue";

import AdminSettings from "./AdminSettings.vue";
import { LocationSettingCategory } from "./categories";

export default defineComponent({
    components: { AdminSettings, GridSettings, PanelModal, VariaSettings, VisionSettings },
    setup() {
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
            LocationSettingCategory.Varia,
        ];

        return { LocationSettingCategory, location, locationName, categoryNames, visible, t };
    },
});
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
            <VariaSettings :location="location" v-show="selection === LocationSettingCategory.Varia" />
        </template>
    </PanelModal>
</template>
