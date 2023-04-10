<script setup lang="ts">
import { computed, watchEffect } from "vue";
import { useI18n } from "vue-i18n";

import PanelModal from "../../../../../core/components/modals/PanelModal.vue";
import { activeShapeStore } from "../../../../../store/activeShape";
import { accessSystem } from "../../../../core/systems/access";
import { accessState } from "../../../../core/systems/access/state";
import { selectedSystem } from "../../../../core/systems/selected";

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

watchEffect(() => {
    const id = selectedSystem.getFocus().value;
    if (id !== undefined) {
        accessSystem.loadState(id);
    } else {
        accessSystem.dropState();
    }
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
                <PropertySettings v-lazy-show="selection === SSC.Properties" />
                <TrackerSettings v-lazy-show="selection === SSC.Trackers" />
                <AccessSettings v-lazy-show="selection === SSC.Access" />
                <LogicSettings v-lazy-show="selection === SSC.Logic" :active-selection="selection === SSC.Logic" />
                <template v-if="owned">
                    <GroupSettings v-lazy-show="selection === SSC.Group" />
                    <ExtraSettings v-lazy-show="selection === SSC.Extra" />
                    <VariantSwitcher />
                </template>
            </div>
        </template>
    </PanelModal>
</template>
