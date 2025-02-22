<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import { roomSystem } from "../../../systems/room";
import { roomState } from "../../../systems/room/state";

const { t } = useI18n();

const enableChat = computed({
    get() {
        return roomState.reactive.enableChat;
    },
    set(enableChat: boolean) {
        roomSystem.setChat(enableChat, true);
    },
});

const enableDice = computed({
    get() {
        return roomState.reactive.enableDice;
    },
    set(enableDice: boolean) {
        roomSystem.setDice(enableDice, true);
    },
});
</script>

<template>
    <div class="panel">
        <div class="row">
            <label for="enableChat">{{ t("game.ui.settings.dm.FeatureSettings.chat") }}</label>
            <input id="enableChat" v-model="enableChat" type="checkbox" />
        </div>
        <div class="row">
            <label for="enableDice">{{ t("game.ui.settings.dm.FeatureSettings.dice") }}</label>
            <input id="enableDice" v-model="enableDice" type="checkbox" />
        </div>
    </div>
</template>

<style lang="scss" scoped>
/* Force higher specificity without !important abuse */
.panel {
    min-width: 15rem;
    grid-template-columns: [setting] 1fr [value] auto [end];
}
</style>
