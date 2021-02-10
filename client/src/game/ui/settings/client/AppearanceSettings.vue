<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import ColorPicker from "@/core/components/colorpicker.vue";
import LanguageSelect from "@/core/components/languageSelect.vue";

import { UserOptions } from "../../../models/settings";
import { gameStore } from "../../../store";

@Component({ components: { ColorPicker, LanguageSelect } })
export default class AppearanceSettings extends Vue {
    get defaultOptions(): UserOptions {
        return gameStore.defaultClientOptions;
    }

    get gridColour(): string {
        return gameStore.gridColour;
    }

    set gridColour(value: string) {
        gameStore.setGridColour({ colour: value, sync: true });
    }

    get gridSize(): number {
        return gameStore.gridSize;
    }

    set gridSize(gridSize: number) {
        if (gridSize < 1) return;
        gameStore.setGridSize({ gridSize, sync: true });
    }

    get fowColour(): string {
        return gameStore.fowColour;
    }

    set fowColour(value: string) {
        gameStore.setFOWColour({ colour: value, sync: true });
    }

    get rulerColour(): string {
        return gameStore.rulerColour;
    }

    set rulerColour(value: string) {
        gameStore.setRulerColour({ colour: value, sync: true });
    }

    setDefault(key: keyof UserOptions): void {
        gameStore.setDefaultClientOption({ key, value: gameStore[key], sync: true });
    }
}
</script>

<template>
    <div class="panel restore-panel">
        <div class="spanrow header">Grid</div>
        <div class="row">
            <label for="languageSelect" v-t="'locale.select'"></label>
            <div>
                <div><LanguageSelect id="languageSelect" /></div>
            </div>
        </div>
        <div class="spanrow header">Grid</div>
        <div class="row">
            <label for="gridColour" v-t="'common.colour'"></label>
            <div>
                <ColorPicker id="gridColour" :color.sync="gridColour" />
            </div>
            <template v-if="gridColour !== defaultOptions.gridColour">
                <div
                    :title="$t('game.ui.settings.common.reset_default')"
                    @click="gridColour = defaultOptions.gridColour"
                >
                    <font-awesome-icon icon="times-circle" />
                </div>
                <div :title="$t('game.ui.settings.common.sync_default')" @click="setDefault('gridColour')">
                    <font-awesome-icon icon="sync-alt" />
                </div>
            </template>
        </div>
        <div class="row">
            <label for="gridSize" v-t="'game.ui.settings.client.AppearanceSettings.grid_size_in_pixels'"></label>
            <div>
                <input id="gridSize" type="number" v-model="gridSize" />
            </div>
            <template v-if="gridSize !== defaultOptions.gridSize">
                <div :title="$t('game.ui.settings.common.reset_default')" @click="gridSize = defaultOptions.gridSize">
                    <font-awesome-icon icon="times-circle" />
                </div>
                <div :title="$t('game.ui.settings.common.sync_default')" @click="setDefault('gridSize')">
                    <font-awesome-icon icon="sync-alt" />
                </div>
            </template>
        </div>
        <div class="spanrow header">Ruler</div>
        <div class="row">
            <label for="rulerColour" v-t="'common.colour'"></label>
            <div>
                <ColorPicker id="rulerColour" :color.sync="rulerColour" />
            </div>
            <template v-if="rulerColour !== defaultOptions.rulerColour">
                <div
                    :title="$t('game.ui.settings.common.reset_default')"
                    @click="rulerColour = defaultOptions.rulerColour"
                >
                    <font-awesome-icon icon="times-circle" />
                </div>
                <div :title="$t('game.ui.settings.common.sync_default')" @click="setDefault('rulerColour')">
                    <font-awesome-icon icon="sync-alt" />
                </div>
            </template>
        </div>
        <div class="spanrow header">Fog</div>
        <div class="row">
            <label for="fowColour" v-t="'common.colour'"></label>
            <div>
                <ColorPicker id="fowColour" :disableAlpha="true" :color.sync="fowColour" />
            </div>
            <template v-if="fowColour !== defaultOptions.fowColour">
                <div :title="$t('game.ui.settings.common.reset_default')" @click="fowColour = defaultOptions.fowColour">
                    <font-awesome-icon icon="times-circle" />
                </div>
                <div :title="$t('game.ui.settings.common.sync_default')" @click="setDefault('fowColour')">
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
