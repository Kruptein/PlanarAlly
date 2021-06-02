<script lang="ts">
import { computed, defineComponent, toRef } from "vue";
import { useI18n } from "vue-i18n";

import { clientStore } from "../../../../store/client";
import { InitiativeEffectMode } from "../../../models/initiative";
import { UserOptions } from "../../../models/settings";

export default defineComponent({
    setup() {
        const { t } = useI18n();

        const defaultOptions = toRef(clientStore.state, "defaultClientOptions");

        const cameraLock = computed({
            get() {
                return clientStore.state.initiativeCameraLock;
            },
            set(cameraLock: boolean) {
                clientStore.setInitiativeCameraLock(cameraLock, true);
            },
        });

        const visionLock = computed({
            get() {
                return clientStore.state.initiativeVisionLock;
            },
            set(visionLock: boolean) {
                clientStore.setInitiativeVisionLock(visionLock, true);
            },
        });

        const effectVisibility = computed({
            get() {
                return clientStore.state.initiativeEffectVisibility;
            },
            set(effectVisibility: InitiativeEffectMode) {
                clientStore.setInitiativeEffectVisibility(effectVisibility, true);
            },
        });

        function setDefault(key: keyof UserOptions): void {
            clientStore.setDefaultClientOption(key, clientStore.state[key], true);
        }

        return {
            t,
            defaultOptions,
            setDefault,
            effectVisibilityOptions: Object.values(InitiativeEffectMode),
            cameraLock,
            effectVisibility,
            visionLock,
        };
    },
});
</script>

<template>
    <div class="panel restore-panel">
        <div class="row">
            <label for="cameraLock" v-t="'game.ui.settings.client.InitiativeSettings.camera_lock'"></label>
            <div><input id="cameraLock" type="checkbox" v-model="cameraLock" /></div>
            <template v-if="cameraLock !== defaultOptions.initiativeCameraLock">
                <div
                    :title="t('game.ui.settings.common.reset_default')"
                    @click="cameraLock = defaultOptions.initiativeCameraLock"
                >
                    <font-awesome-icon icon="times-circle" />
                </div>
                <div :title="t('game.ui.settings.common.sync_default')" @click="setDefault('initiativeCameraLock')">
                    <font-awesome-icon icon="sync-alt" />
                </div>
            </template>
        </div>
        <div class="row">
            <label for="visionLock" v-t="'game.ui.settings.client.InitiativeSettings.vision_lock'"></label>
            <div><input id="visionLock" type="checkbox" v-model="visionLock" /></div>
            <template v-if="visionLock !== defaultOptions.initiativeVisionLock">
                <div
                    :title="t('game.ui.settings.common.reset_default')"
                    @click="visionLock = defaultOptions.initiativeVisionLock"
                >
                    <font-awesome-icon icon="times-circle" />
                </div>
                <div :title="t('game.ui.settings.common.sync_default')" @click="setDefault('initiativeVisionLock')">
                    <font-awesome-icon icon="sync-alt" />
                </div>
            </template>
        </div>
        <div class="row">
            <label for="effectVisibility" v-t="'game.ui.settings.client.InitiativeSettings.effect_visibility'"></label>
            <div>
                <select @change="effectVisibility = $event.target.value" size="">
                    <option
                        v-for="option in effectVisibilityOptions"
                        :key="option"
                        :value="option"
                        :label="t('game.ui.settings.client.InitiativeSettings.effect_' + option)"
                        :selected="option === effectVisibility"
                    ></option>
                </select>
            </div>
            <template v-if="effectVisibility !== defaultOptions.initiativeEffectVisibility">
                <div
                    :title="t('game.ui.settings.common.reset_default')"
                    @click="effectVisibility = defaultOptions.initiativeEffectVisibility"
                >
                    <font-awesome-icon icon="times-circle" />
                </div>
                <div
                    :title="t('game.ui.settings.common.sync_default')"
                    @click="setDefault('initiativeEffectVisibility')"
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
