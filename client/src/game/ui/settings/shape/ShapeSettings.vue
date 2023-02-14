<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import PanelModal from "../../../../core/components/modals/PanelModal.vue";
import { activeShapeStore } from "../../../../store/activeShape";
import { accessState } from "../../../systems/access/state";

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

function close(): void {
    visible.value = false;
}
defineExpose({ close });

const hasShape = computed(() => activeShapeStore.state.id !== undefined);

const categoryNames = computed(() => {
    if (accessState.hasEditAccess.value) {
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

const owned = accessState.hasEditAccess;
const SSC = ShapeSettingCategory;
</script>

<template>
    <PanelModal v-model:visible="visible" :categories="categoryNames">
        <template #title>{{ t("game.ui.selection.edit_dialog.dialog.edit_shape") }}</template>
        <template #default="{ selection }">
            <div v-if="hasShape" style="display: flex; flex-direction: column">
                <PropertySettings v-show="selection === SSC.Properties" />
                <TrackerSettings :active-selection="selection === SSC.Trackers" />
                <AccessSettings :active-selection="selection === SSC.Access" />
                <LogicSettings :active-selection="selection === SSC.Logic" />
                <GroupSettings v-show="owned && selection === SSC.Group" />
                <ExtraSettings v-show="owned && selection === SSC.Extra" />
                <VariantSwitcher v-show="owned" />
            </div>
        </template>
    </PanelModal>
</template>
