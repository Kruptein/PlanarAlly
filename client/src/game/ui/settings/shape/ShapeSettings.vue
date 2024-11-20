<script setup lang="ts">
import { type Component, computed, watchEffect } from "vue";
import { useI18n } from "vue-i18n";

import PanelModal from "../../../../core/components/modals/PanelModal.vue";
import { activeShapeStore } from "../../../../store/activeShape";
import { accessSystem } from "../../../systems/access";
import { accessState } from "../../../systems/access/state";
import { selectedState } from "../../../systems/selected/state";
import { uiState } from "../../../systems/ui/state";

import AccessSettings from "./AccessSettings.vue";
import ExtraSettings from "./ExtraSettings.vue";
import GridSettings from "./GridSettings.vue";
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

const owned = accessState.hasEditAccess;

watchEffect(() => {
    const id = selectedState.reactive.focus;
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

const tabs = computed(() => {
    const tabs: { name: string; component: Component }[] = [];
    if (!hasShape.value) return tabs;
    tabs.push(
        { name: t('game.ui.selection.edit_dialog.properties.properties'), component: PropertySettings },
        { name: t('common.grid'), component: GridSettings },
        { name: t('common.trackers'), component: TrackerSettings },
        { name: t('game.ui.selection.edit_dialog.access.access'), component: AccessSettings },
        { name: t('game.ui.selection.edit_dialog.logic.logic'), component: LogicSettings },
    );
    if (owned.value) {
        tabs.push({ name: t('game.ui.selection.edit_dialog.groups.groups'), component: GroupSettings }, { name: t('game.ui.selection.edit_dialog.extra.extra'), component: ExtraSettings });
    }
    for (const charTab of uiState.mutableReactive.characterTabs) {
        if (charTab.filter?.(activeShapeStore.state.id!) ?? true) tabs.push(charTab);
    }

    return tabs;
});
</script>

<template>
    <PanelModal v-model:visible="visible" :tabs="tabs">
        <template #title>{{ t("game.ui.selection.edit_dialog.dialog.edit_shape") }}</template>
        <template v-if="owned" #default>
            <div style="flex-grow: 1"></div>
            <VariantSwitcher />
        </template>
    </PanelModal>
</template>
