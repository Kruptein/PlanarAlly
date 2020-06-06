<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import LocationAdminSettings from "./LocationAdminSettings.vue";
import GridSettings from "../GridSettings.vue";
// import PermissionsDmSettings from "./permissions.vue";
import VisionSettings from "../VisionSettings.vue";

import PanelModal from "../../../../core/components/modals/PanelModal.vue";
import { EventBus } from "@/game/event-bus";
import { gameStore } from "@/game/store";

@Component({
    components: {
        GridSettings,
        // PermissionsDmSettings,
        LocationAdminSettings,
        PanelModal,
        VisionSettings,
    },
})
export default class LocationSettings extends Vue {
    location = gameStore.locations[0].id;
    visible = false;

    get locationName(): string {
        return gameStore.locations.find(l => l.id === this.location)!.name;
    }

    mounted(): void {
        EventBus.$on("LocationSettings.Open", (location: number) => {
            this.visible = true;
            this.location = location;
        });
    }

    beforeDestroy(): void {
        EventBus.$off("LocationSettings.Open");
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
        <template v-slot:title>
            {{ $t("game.ui.settings.location.LocationSettings.location_settings") }} {{ locationName }}
        </template>
        <template v-slot:default="{ selection }">
            <LocationAdminSettings
                :location.sync="location"
                v-show="selection === 0"
                @close="visible = false"
            ></LocationAdminSettings>
            <GridSettings :location="location" v-show="selection === 1"></GridSettings>
            <VisionSettings :location="location" v-show="selection === 2"></VisionSettings>
        </template>
    </PanelModal>
</template>
