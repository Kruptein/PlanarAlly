<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import PanelModal from "../../../../core/components/modals/PanelModal.vue";
import { activeShapeStore } from "../../ActiveShapeStore";

import AccessSettings from "./AccessSettings.vue";
import ExtraSettings from "./ExtraSettings.vue";
import GroupSettings from "./GroupSettings.vue";
import PropertySettings from "./PropertySettings.vue";
import TrackerSettings from "./TrackerSettings.vue";
import VariantSwitcher from "./VariantSwitcher.vue";

@Component({
    components: {
        AccessSettings,
        ExtraSettings,
        GroupSettings,
        PanelModal,
        PropertySettings,
        TrackerSettings,
        VariantSwitcher,
    },
})
export default class ShapeSettings extends Vue {
    private _visible = false;

    get visible(): boolean {
        return activeShapeStore.showEditDialog;
    }

    setVisible(visible: boolean): void {
        activeShapeStore.setShowEditDialog(visible);
    }

    get hasShape(): boolean {
        return activeShapeStore.uuid !== undefined;
    }

    get owned(): boolean {
        return activeShapeStore.hasEditAccess;
    }

    get categoryNames(): string[] {
        if (this.owned) return ["Properties", "Trackers", "Access", "Group", "Extra"];
        else return ["Properties", "Trackers", "Access"];
    }
}
</script>

<template>
    <PanelModal :visible="visible" @update:visible="setVisible" :categories="categoryNames">
        <template v-slot:title>{{ $t("game.ui.selection.edit_dialog.dialog.edit_asset") }}</template>
        <template v-slot:default="{ selection }">
            <div v-if="hasShape" style="display: flex; flex-direction: column">
                <PropertySettings v-show="selection === 0" />
                <TrackerSettings v-show="selection === 1" />
                <AccessSettings v-show="selection === 2" />
                <GroupSettings v-show="owned && selection === 3" />
                <ExtraSettings v-show="owned && selection === 4" />
                <VariantSwitcher v-show="owned" />
            </div>
        </template>
    </PanelModal>
</template>
