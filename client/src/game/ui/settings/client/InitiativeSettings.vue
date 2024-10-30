<script setup lang="ts">
import { useI18n } from "vue-i18n";

import { InitiativeEffectMode } from "../../../models/initiative";

import OverrideReset from "./OverrideReset.vue";
import { useClientSettings } from "./useClientSettings";

const { t } = useI18n();

const effectVisibilityOptions = Object.values(InitiativeEffectMode);

const openOnActivate = useClientSettings("initiativeOpenOnActivate");
const cameraLock = useClientSettings("initiativeCameraLock");
const visionLock = useClientSettings("initiativeVisionLock");
const effectVisibility = useClientSettings("initiativeEffectVisibility");

function setEffectVisibility(event: Event): void {
    effectVisibility.value = (event.target as HTMLSelectElement).value as InitiativeEffectMode;
}
</script>

<template>
    <div class="panel restore-panel">
        <div class="row">
            <label for="openOnActivate">{{ t("game.ui.settings.client.InitiativeSettings.open_on_activate") }}</label>
            <div><input id="openOnActivate" v-model="openOnActivate" type="checkbox" /></div>
            <OverrideReset setting="initiativeOpenOnActivate" />
        </div>
        <div class="row">
            <label for="cameraLock">{{ t("game.ui.settings.client.InitiativeSettings.camera_lock") }}</label>
            <div><input id="cameraLock" v-model="cameraLock" type="checkbox" /></div>
            <OverrideReset setting="initiativeCameraLock" />
        </div>
        <div class="row">
            <label for="visionLock">{{ t("game.ui.settings.client.InitiativeSettings.vision_lock") }}</label>
            <div><input id="visionLock" v-model="visionLock" type="checkbox" /></div>
            <OverrideReset setting="initiativeVisionLock" />
        </div>
        <div class="row">
            <label for="effectVisibility">
                {{ t("game.ui.settings.client.InitiativeSettings.effect_visibility") }}
            </label>
            <div>
                <select @change="setEffectVisibility">
                    <option
                        v-for="option in effectVisibilityOptions"
                        :key="option"
                        :value="option"
                        :label="t('game.ui.settings.client.InitiativeSettings.effect_' + option)"
                        :selected="option === effectVisibility"
                    ></option>
                </select>
            </div>
            <OverrideReset setting="initiativeEffectVisibility" />
        </div>
    </div>
</template>

<style scoped>
/* Force higher specificity without !important abuse */
.panel.restore-panel {
    min-width: 20vw;
    column-gap: 15px;
    grid-template-columns: [setting] 1fr [value] auto [restore] 30px [sync] 30px [end];
}

label {
    grid-column-start: setting;
}

.overwritten,
.restore-panel .row.overwritten * {
    color: #7c253e;
    font-weight: bold;
}

.panel input[type="number"] {
    width: 50px;
}
</style>
