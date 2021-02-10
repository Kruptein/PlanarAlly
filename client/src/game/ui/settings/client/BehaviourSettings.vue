<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import { UserOptions } from "../../../models/settings";
import { gameStore } from "../../../store";

@Component
export default class BehaviourSettings extends Vue {
    get defaultOptions(): UserOptions {
        return gameStore.defaultClientOptions;
    }

    get invertAlt(): boolean {
        return gameStore.invertAlt;
    }

    set invertAlt(value: boolean) {
        gameStore.setInvertAlt({ invertAlt: value, sync: true });
    }

    get disableScrollToZoom(): boolean {
        return gameStore.disableScrollToZoom;
    }

    set disableScrollToZoom(value: boolean) {
        gameStore.setDisableScrollToZoom({ disableScrollToZoom: value, sync: true });
    }

    setDefault(key: keyof UserOptions): void {
        gameStore.setDefaultClientOption({ key, value: gameStore[key], sync: true });
    }
}
</script>

<template>
    <div class="panel restore-panel">
        <div class="spanrow header">Snapping</div>
        <div class="row">
            <label for="invertAlt" v-t="'game.ui.settings.client.BehaviourSettings.invert_alt_set'"></label>
            <div><input id="invertAlt" type="checkbox" v-model="invertAlt" /></div>
            <template v-if="invertAlt !== defaultOptions.invertAlt">
                <div :title="$t('game.ui.settings.common.reset_default')" @click="invertAlt = defaultOptions.invertAlt">
                    <font-awesome-icon icon="times-circle" />
                </div>
                <div :title="$t('game.ui.settings.common.sync_default')" @click="setDefault('invertAlt')">
                    <font-awesome-icon icon="sync-alt" />
                </div>
            </template>
        </div>
        <div class="spanrow header">Mouse & Gestures</div>
        <div class="row">
            <label
                for="disableScrollToZoom"
                v-t="'game.ui.settings.client.BehaviourSettings.disable_scroll_to_zoom'"
            ></label>
            <div><input id="disableScrollToZoom" type="checkbox" v-model="disableScrollToZoom" /></div>
            <template v-if="disableScrollToZoom !== defaultOptions.disableScrollToZoom">
                <div
                    :title="$t('game.ui.settings.common.reset_default')"
                    @click="disableScrollToZoom = defaultOptions.disableScrollToZoom"
                >
                    <font-awesome-icon icon="times-circle" />
                </div>
                <div :title="$t('game.ui.settings.common.sync_default')" @click="setDefault('disableScrollToZoom')">
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
