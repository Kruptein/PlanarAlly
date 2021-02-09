<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import { gameStore } from "../../../store";

@Component
export default class BehaviourSettings extends Vue {
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
        <div class="spanrow header">Grid</div>
        <div class="row">
            <label for="invertAlt" v-t="'game.ui.settings.client.BehaviourSettings.invert_alt_set'"></label>
            <div><input id="invertAlt" type="checkbox" v-model="invertAlt" /></div>
            <div v-if="1 < 2" :title="$t('game.ui.settings.common.reset_default')">
                <font-awesome-icon icon="times-circle" />
            </div>
            <div v-else></div>
        </div>
    </div>
</template>

<style scoped>
/* Force higher specificity without !important abuse */
.panel.restore-panel {
    min-width: 20vw;
    column-gap: 15px;
    grid-template-columns: [setting] 1fr [value] auto [restore] 30px [end];
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
