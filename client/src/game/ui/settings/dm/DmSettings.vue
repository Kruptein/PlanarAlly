<script lang="ts">
import { computed, defineComponent } from "vue";
import { useI18n } from "vue-i18n";

import PanelModal from "../../../../core/components/modals/PanelModal.vue";
import { uiStore } from "../../../../store/ui";
import GridSettings from "../location/GridSettings.vue";
import VariaSettings from "../location/VariaSettings.vue";
import VisionSettings from "../location/VisionSettings.vue";

import AdminSettings from "./AdminSettings.vue";
import { DmSettingCategory } from "./categories";

export default defineComponent({
    components: { AdminSettings, GridSettings, PanelModal, VariaSettings, VisionSettings },
    setup() {
        const { t } = useI18n();

        const visible = computed({
            get() {
                return uiStore.state.showDmSettings;
            },
            set(visible: boolean) {
                uiStore.showDmSettings(visible);
            },
        });

        const categoryNames = computed(() => {
            return [DmSettingCategory.Admin, DmSettingCategory.Grid, DmSettingCategory.Vision, DmSettingCategory.Varia];
        });

        return { DmSettingCategory, categoryNames, visible, t };
    },
});
</script>

<template>
    <PanelModal v-model:visible="visible" :categories="categoryNames" :applyTranslation="true">
        <template v-slot:title>{{ t("game.ui.settings.dm.DmSettings.dm_settings") }}</template>
        <template v-slot:default="{ selection }">
            <AdminSettings v-show="selection === DmSettingCategory.Admin" />
            <GridSettings v-show="selection === DmSettingCategory.Grid" />
            <VisionSettings v-show="selection === DmSettingCategory.Vision" />
            <VariaSettings v-show="selection === DmSettingCategory.Varia" />
        </template>
    </PanelModal>
</template>
