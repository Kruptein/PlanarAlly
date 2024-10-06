<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import { InitiativeEffectMode } from "../../../models/initiative";
import { playerSettingsSystem } from "../../../systems/settings/players";
import { playerSettingsState } from "../../../systems/settings/players/state";

const { t } = useI18n();

const { reactive: $ } = playerSettingsState;
const pss = playerSettingsSystem;

const effectVisibilityOptions = Object.values(InitiativeEffectMode);

const openOnActivate = computed<boolean | undefined>({
    get() {
        return $.initiativeOpenOnActivate.value;
    },
    set(openOnActivate: boolean | undefined) {
        pss.setInitiativeOpenOnActivate(openOnActivate, { sync: true });
    },
});

const cameraLock = computed<boolean | undefined>({
    get() {
        return $.initiativeCameraLock.value;
    },
    set(cameraLock: boolean | undefined) {
        pss.setInitiativeCameraLock(cameraLock, { sync: true });
    },
});

const visionLock = computed<boolean | undefined>({
    get() {
        return $.initiativeVisionLock.value;
    },
    set(visionLock: boolean | undefined) {
        pss.setInitiativeVisionLock(visionLock, { sync: true });
    },
});

const effectVisibility = computed<InitiativeEffectMode | undefined>({
    get() {
        return $.initiativeEffectVisibility.value;
    },
    set(effectVisibility: InitiativeEffectMode | undefined) {
        pss.setInitiativeEffectVisibility(effectVisibility, { sync: true });
    },
});

function setEffectVisibility(event: Event): void {
    effectVisibility.value = (event.target as HTMLSelectElement).value as InitiativeEffectMode;
}
</script>

<template>
    <div class="panel restore-panel">
        <div class="row">
            <label for="openOnActivate">{{ t("game.ui.settings.client.InitiativeSettings.open_on_activate") }}</label>
            <div><input id="openOnActivate" v-model="openOnActivate" type="checkbox" /></div>
            <template v-if="$.initiativeOpenOnActivate.override !== undefined">
                <div :title="t('game.ui.settings.common.reset_default')" @click="openOnActivate = undefined">
                    <font-awesome-icon icon="times-circle" />
                </div>
                <div
                    :title="t('game.ui.settings.common.sync_default')"
                    @click="
                        pss.setInitiativeOpenOnActivate(undefined, {
                            sync: true,
                            default: $.initiativeOpenOnActivate.override,
                        })
                    "
                >
                    <font-awesome-icon icon="sync-alt" />
                </div>
            </template>
        </div>
        <div class="row">
            <label for="cameraLock">{{ t("game.ui.settings.client.InitiativeSettings.camera_lock") }}</label>
            <div><input id="cameraLock" v-model="cameraLock" type="checkbox" /></div>
            <template v-if="$.initiativeCameraLock.override !== undefined">
                <div :title="t('game.ui.settings.common.reset_default')" @click="cameraLock = undefined">
                    <font-awesome-icon icon="times-circle" />
                </div>
                <div
                    :title="t('game.ui.settings.common.sync_default')"
                    @click="
                        pss.setInitiativeCameraLock(undefined, { sync: true, default: $.initiativeCameraLock.override })
                    "
                >
                    <font-awesome-icon icon="sync-alt" />
                </div>
            </template>
        </div>
        <div class="row">
            <label for="visionLock">{{ t("game.ui.settings.client.InitiativeSettings.vision_lock") }}</label>
            <div><input id="visionLock" v-model="visionLock" type="checkbox" /></div>
            <template v-if="$.initiativeVisionLock.override !== undefined">
                <div :title="t('game.ui.settings.common.reset_default')" @click="visionLock = undefined">
                    <font-awesome-icon icon="times-circle" />
                </div>
                <div
                    :title="t('game.ui.settings.common.sync_default')"
                    @click="
                        pss.setInitiativeVisionLock(undefined, { sync: true, default: $.initiativeVisionLock.override })
                    "
                >
                    <font-awesome-icon icon="sync-alt" />
                </div>
            </template>
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
            <template v-if="$.initiativeEffectVisibility.override !== undefined">
                <div :title="t('game.ui.settings.common.reset_default')" @click="effectVisibility = undefined">
                    <font-awesome-icon icon="times-circle" />
                </div>
                <div
                    :title="t('game.ui.settings.common.sync_default')"
                    @click="
                        pss.setInitiativeEffectVisibility(undefined, {
                            sync: true,
                            default: $.initiativeEffectVisibility.override,
                        })
                    "
                >
                    <font-awesome-icon icon="sync-alt" />
                </div>
            </template>
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
