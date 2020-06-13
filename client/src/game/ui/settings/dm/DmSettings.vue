<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import AdminSettings from "./AdminSettings.vue";
import GridSettings from "../GridSettings.vue";
// import PermissionsDmSettings from "./permissions.vue";
import VisionSettings from "../VisionSettings.vue";

import PanelModal from "../../../../core/components/modals/PanelModal.vue";
import { EventBus } from "@/game/event-bus";

@Component({
    components: {
        AdminSettings,
        GridSettings,
        // PermissionsDmSettings,
        PanelModal,
        VisionSettings,
    },
})
export default class DmSettings extends Vue {
    visible = false;

    mounted(): void {
        EventBus.$on("DmSettings.Open", () => {
            this.visible = true;
        });
    }

    beforeDestroy(): void {
        EventBus.$off("DmSettings.Open");
    }

    get categoryNames(): string[] {
        return [
            this.$t("common.admin").toString(),
            this.$t("common.grid").toString(),
            this.$t("common.vision").toString(),
        ];
    }
}
</script>

<template>
    <PanelModal :visible.sync="visible" :categories="categoryNames">
        <template v-slot:title>{{ $t("game.ui.settings.dm.DmSettings.dm_settings") }}</template>
        <template v-slot:default="{ selection }">
            <AdminSettings v-show="selection === 0"></AdminSettings>
            <GridSettings :location="null" v-show="selection === 1"></GridSettings>
            <VisionSettings :location="null" v-show="selection === 2"></VisionSettings>
        </template>
    </PanelModal>
</template>
