<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import PanelModal from "../../../../core/components/modals/PanelModal.vue";
import AccessSettings from "./AccessSettings.vue";
import ExtraSettings from "./ExtraSettings.vue";
import GroupSettings from "./GroupSettings.vue";
import PropertySettings from "./PropertySettings.vue";
import TrackerSettings from "./TrackerSettings.vue";

import { EventBus } from "@/game/event-bus";
import { Shape } from "@/game/shapes/shape";
import { Prop } from "vue-property-decorator";
import { gameStore } from "@/game/store";

@Component({
    components: {
        AccessSettings,
        ExtraSettings,
        GroupSettings,
        PanelModal,
        PropertySettings,
        TrackerSettings,
    },
})
export default class ShapeSettings extends Vue {
    @Prop() shape!: Shape;

    visible = false;

    get owned(): boolean {
        return this.shape.ownedBy({ editAccess: true });
    }

    mounted(): void {
        EventBus.$on("EditDialog.Open", (shape: Shape) => {
            this.shape = shape;
            this.visible = true;
        });
        EventBus.$on("EditDialog.AddLabel", (label: string) => {
            if (this.visible) {
                this.shape.labels.push(gameStore.labels[label]);
                console.log("Label refresh");
            }
        });
    }

    beforeDestroy(): void {
        EventBus.$off("EditDialog.Open");
        EventBus.$off("EditDialog.AddLabel");
    }

    get categoryNames(): string[] {
        if (this.owned) return ["Properties", "Trackers", "Access", "Group", "Extra"];
        else return ["Properties", "Trackers", "Access", "Extra"];
    }

    // the Group panel is not always shown and thus changes the selection order
    // this is a bit more wieldy than a simple selection === check,
    // so should only be used for panels that appear after potentially disappearing panels
    is(selection: number, category: string): boolean {
        return this.categoryNames[selection].toLowerCase() === category.toLowerCase();
    }
}
</script>

<template>
    <PanelModal :visible.sync="visible" :categories="categoryNames">
        <template v-slot:title>{{ $t("game.ui.selection.edit_dialog.dialog.edit_asset") }}</template>
        <template v-slot:default="{ selection }">
            <PropertySettings v-show="selection === 0" :shape="shape" :owned="owned"></PropertySettings>
            <TrackerSettings v-show="selection === 1" :shape="shape" :owned="owned"></TrackerSettings>
            <AccessSettings v-show="selection === 2" :shape="shape" :owned="owned"></AccessSettings>
            <GroupSettings v-show="owned && selection === 3" :shape="shape" :owned="owned"></GroupSettings>
            <ExtraSettings
                v-show="is(selection, 'extra')"
                :shape="shape"
                :owned="owned"
                :active="is(selection, 'extra')"
            ></ExtraSettings>
        </template>
    </PanelModal>
</template>
