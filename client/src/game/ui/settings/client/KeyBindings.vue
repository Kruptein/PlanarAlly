<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import { gameStore } from "@/game/store";

@Component
export default class KeyBindings extends Vue {
    get invertAlt(): boolean {
        return gameStore.invertAlt;
    }
    set invertAlt(value: boolean) {
        gameStore.setInvertAlt({ invertAlt: value, sync: true });
    }
}
</script>

<template>
    <div class="panel restore-panel">
        <div class="row">
            <label for="invertAlt" v-t="'game.ui.menu.menu.invert_alt_set'"></label>
            <div><input id="invertAlt" type="checkbox" v-model="invertAlt" /></div>
        </div>
    </div>
</template>
