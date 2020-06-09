<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import ColorPicker from "@/core/components/colorpicker.vue";
import { gameStore } from "@/game/store";

@Component({
    components: {
        "color-picker": ColorPicker,
    },
})
export default class ColorSettings extends Vue {
    get gridColour(): string {
        return gameStore.gridColour;
    }
    set gridColour(value: string) {
        gameStore.setGridColour({ colour: value, sync: true });
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
}
</script>

<template>
    <div class="panel restore-panel">
        <div class="row">
            <label for="gridColour" v-t="'game.ui.menu.menu.grid_color_set'"></label>
            <color-picker id="gridColour" :color.sync="gridColour" />
        </div>
        <div class="row">
            <label for="fowColour" v-t="'game.ui.menu.menu.fow_color_set'"></label>
            <color-picker id="fowColour" :color.sync="fowColour" />
        </div>
        <div class="row">
            <label for="rulerColour" v-t="'game.ui.menu.menu.ruler_color_set'"></label>
            <color-picker id="rulerColour" :color.sync="rulerColour" />
        </div>
    </div>
</template>
