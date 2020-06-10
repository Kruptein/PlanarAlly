<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import GeneralSettings from "./GeneralSettings.vue";
import ColorSettings from "./ColorSettings.vue";
import KeyBindings from "./KeyBindings.vue";

import PanelModal from "../../../../core/components/modals/PanelModal.vue";
import { EventBus } from "@/game/event-bus";

@Component({
    components: {
        PanelModal,
        GeneralSettings,
        ColorSettings,
        KeyBindings,
    },
})
export default class ClientSettings extends Vue {
    visible = false;

    mounted(): void {
        EventBus.$on("ClientSettings.Open", () => {
            this.visible = true;
        });
    }

    beforeDestroy(): void {
        EventBus.$off("ClientSettings.Open");
    }

    get categoryNames(): string[] {
        return [
            this.$t("common.general").toString(),
            this.$t("common.colors").toString(),
            this.$t("common.keys").toString(),
        ];
    }
}
</script>

<template>
    <PanelModal :visible.sync="visible" :categories="categoryNames">
        <template v-slot:title>{{ $t("game.ui.settings.client.GeneralSettings.client_settings") }}</template>
        <template v-slot:default="{ selection }">
            <GeneralSettings v-show="selection === 0"></GeneralSettings>
            <ColorSettings v-show="selection === 1"></ColorSettings>
            <KeyBindings v-show="selection === 2"></KeyBindings>
        </template>
    </PanelModal>
</template>
