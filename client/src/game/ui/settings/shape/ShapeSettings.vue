<script setup lang="ts">
import { computed, ref, unref, watchEffect } from "vue";
import { useI18n } from "vue-i18n";

import PanelModal from "../../../../core/components/modals/PanelModal.vue";
import { activeShapeStore } from "../../../../store/activeShape";
import { accessSystem } from "../../../systems/access";
import { accessState } from "../../../systems/access/state";
import { selectedState } from "../../../systems/selected/state";
import { uiState } from "../../../systems/ui/state";
import type { PanelTab } from "../../../systems/ui/types";

import AccessSettings from "./AccessSettings.vue";
import { ShapeSettingCategory } from "./categories";
import DataSettings from "./DataSettings.vue";
import ExtraSettings from "./ExtraSettings.vue";
import GridSettings from "./GridSettings.vue";
import GroupSettings from "./GroupSettings.vue";
import LogicSettings from "./LogicSettings.vue";
import PropertySettings from "./PropertySettings.vue";
import TrackerSettings from "./TrackerSettings.vue";
import VariantSettings from "./VariantSettings.vue";
import { getShape } from "../../../id";
import { IShape } from "../../../interfaces/shape";

const { t } = useI18n();
const shape = ref<IShape | null>(null);

const visible = computed({
    get() {
        return activeShapeStore.state.showEditDialog;
    },
    set(visible: boolean) {
        activeShapeStore.setShowEditDialog(visible);
    },
});

const owned = accessState.hasEditAccess;

watchEffect(() => {
    const id = selectedState.reactive.focus;
    if (id !== undefined) {
        accessSystem.loadState(id);
        shape.value = getShape(id) ?? null;
    } else {
        accessSystem.dropState();
        shape.value = null;
    }
});

function close(): void {
    visible.value = false;
}
defineExpose({ close });

const hasShape = computed(() => activeShapeStore.state.id !== undefined);

const fixedTabs: PanelTab[] = [
    {
        id: ShapeSettingCategory.Properties,
        label: t("game.ui.selection.edit_dialog.properties.properties"),
        component: PropertySettings,
    },
    { id: ShapeSettingCategory.Grid, label: t("common.grid"), component: GridSettings },
    { id: ShapeSettingCategory.Trackers, label: t("common.trackers"), component: TrackerSettings },
    {
        id: ShapeSettingCategory.Access,
        label: t("game.ui.selection.edit_dialog.access.access"),
        component: AccessSettings,
    },
    {
        id: ShapeSettingCategory.Logic,
        label: t("game.ui.selection.edit_dialog.logic.logic"),
        component: LogicSettings,
    },
];

const ownedTabs = computed<PanelTab[]>(() => [
    {
        id: ShapeSettingCategory.Group,
        label: t("game.ui.selection.edit_dialog.groups.groups"),
        component: GroupSettings,
    },
    {
        id: ShapeSettingCategory.CustomData,
        label: t("game.ui.selection.edit_dialog.customData.customData"),
        component: DataSettings,
    },
    ...(shape.value?.type === "assetrect"
        ? [
              {
                  id: ShapeSettingCategory.Variants,
                  label: t("game.ui.selection.edit_dialog.variants.variants"),
                  component: VariantSettings,
              },
          ]
        : []),
    {
        id: ShapeSettingCategory.Extra,
        label: t("game.ui.selection.edit_dialog.extra.extra"),
        component: ExtraSettings,
    },
]);

const tabs = computed(() => {
    const tabs: PanelTab[] = [];
    if (!hasShape.value) return tabs;

    tabs.push(...fixedTabs);
    if (owned.value) {
        tabs.push(...ownedTabs.value);
    }

    for (const charTab of uiState.mutableReactive.characterTabs) {
        if (charTab.filter) {
            if (unref(charTab.filter)(activeShapeStore.state.id!, owned.value)) tabs.push(charTab.tab);
        } else {
            tabs.push(charTab.tab);
        }
    }

    // Ensure we always show a tab that exists
    if (!tabs.some((t) => t.id === uiState.reactive.activeShapeTab)) {
        uiState.mutableReactive.activeShapeTab = tabs[0]?.id as ShapeSettingCategory;
    }

    return tabs;
});
</script>

<template>
    <PanelModal v-model:visible="visible" v-model:selection="uiState.reactive.activeShapeTab" :tabs="tabs">
        <template #title>{{ t("game.ui.selection.edit_dialog.dialog.edit_shape") }}</template>
    </PanelModal>
</template>
