<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import PanelModal from "../../../../core/components/modals/PanelModal.vue";

import AppearanceSettings from "./AppearanceSettings.vue";
import BehaviourSettings from "./BehaviourSettings.vue";

@Component({
    components: {
        AppearanceSettings,
        BehaviourSettings,
        PanelModal,
    },
})
export default class ClientSettings extends Vue {
    visible = false;

    open(): void {
        this.visible = true;
    }

    get categoryNames(): string[] {
        return ["Appearance", "Behaviour"];
    }
}
</script>

<template>
    <PanelModal :visible.sync="visible" :categories="categoryNames">
        <template v-slot:title>{{ $t("game.ui.settings.client.ClientSettings.client_settings") }}</template>
        <template v-slot:default="{ selection }">
            <AppearanceSettings v-show="selection === 0" />
            <BehaviourSettings v-show="selection === 1" />
        </template>
    </PanelModal>
</template>
