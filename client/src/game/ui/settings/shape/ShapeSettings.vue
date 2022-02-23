<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import PanelModal from "../../../../core/components/modals/PanelModal.vue";
import { activeShapeStore } from "../../../../store/activeShape";
import { accessSystem } from "../../../systems/access";

import AccessSettings from "./AccessSettings.vue";
import { ShapeSettingCategory } from "./categories";
import ExtraSettings from "./ExtraSettings.vue";
import GroupSettings from "./GroupSettings.vue";
import LogicSettings from "./LogicSettings.vue";
import PropertySettings from "./PropertySettings.vue";
import TrackerSettings from "./TrackerSettings.vue";
import VariantSwitcher from "./VariantSwitcher.vue";

const { t } = useI18n();

const visible = computed({
    get() {
        return activeShapeStore.state.showEditDialog;
    },
    set(visible: boolean) {
        activeShapeStore.setShowEditDialog(visible);
    },
});

const hasShape = computed(() => activeShapeStore.state.id !== undefined);

const categoryNames = computed(() => {
    if (accessSystem.$.hasEditAccess.value) {
        return [
            ShapeSettingCategory.Properties,
            ShapeSettingCategory.Trackers,
            ShapeSettingCategory.Logic,
            ShapeSettingCategory.Access,
            ShapeSettingCategory.Group,
            ShapeSettingCategory.Extra,
        ];
    }
    return [ShapeSettingCategory.Properties, ShapeSettingCategory.Trackers, ShapeSettingCategory.Access];
});

const owned = accessSystem.$.hasEditAccess;
const SSC = ShapeSettingCategory;
</script>

<template>
    <PanelModal v-model:visible="visible" :categories="categoryNames">
        <template v-slot:title>{{ t("game.ui.selection.edit_dialog.dialog.edit_asset") }}</template>
        <template v-slot:default="{ selection }">
            <div v-if="hasShape" style="display: flex; flex-direction: column">
                <PropertySettings v-show="selection === SSC.Properties" />
                <TrackerSettings :activeSelection="selection === SSC.Trackers" />
                <AccessSettings :activeSelection="selection === SSC.Access" />
                <LogicSettings :activeSelection="selection === SSC.Logic" />
                <GroupSettings v-show="owned && selection === SSC.Group" />
                <ExtraSettings v-show="owned && selection === SSC.Extra" />
                <VariantSwitcher v-show="owned" />
            </div>
        </template>
    </PanelModal>
</template>
