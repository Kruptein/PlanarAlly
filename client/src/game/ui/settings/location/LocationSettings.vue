<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

// import AdminSettings from "./AdminSettings.vue";
import GridSettings from "../GridSettings.vue";
// import PermissionsDmSettings from "./permissions.vue";
import VisionSettings from "../VisionSettings.vue";

import PanelModal from "../../../../core/components/modals/PanelModal.vue";
import { EventBus } from "@/game/event-bus";

@Component({
    components: {
        GridSettings,
        // PermissionsDmSettings,
        PanelModal,
        VisionSettings,
    },
})
export default class LocationSettings extends Vue {
    location = "";
    visible = false;

    mounted(): void {
        EventBus.$on("LocationSettings.Open", (location: string) => {
            this.visible = true;
            this.location = location;
        });
    }

    beforeDestroy(): void {
        EventBus.$off("LocationSettings.Open");
    }
}
</script>

<template>
    <PanelModal :visible.sync="visible" :categories="['Admin', 'Grid', 'Vision']">
        <template v-slot:title>Location Settings: {{ location }}</template>
        <template v-slot:default="{ selection }">
            <!-- <AdminSettings v-show="selection === 0"></AdminSettings> -->
            <GridSettings :location="location" v-show="selection === 1"></GridSettings>
            <VisionSettings :location="location" v-show="selection === 2"></VisionSettings>
        </template>
    </PanelModal>
</template>
