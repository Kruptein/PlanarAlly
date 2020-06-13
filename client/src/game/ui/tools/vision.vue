<script lang="ts">
import Component from "vue-class-component";

import Tool from "@/game/ui/tools/tool.vue";

import { layerManager } from "@/game/layers/manager";
import { gameStore } from "@/game/store";
import { Shape } from "../../shapes/shape";
import { ToolName } from "./utils";

@Component
export default class VisionTool extends Tool {
    name = ToolName.Vision;
    active = false;

    get selection(): string[] {
        return gameStore.activeTokens;
    }

    get tokens(): Shape[] {
        return gameStore.ownedtokens.map(t => layerManager.UUIDMap.get(t)!);
    }

    toggle(uuid: string): void {
        if (this.selection.includes(uuid)) gameStore.removeActiveToken(uuid);
        else gameStore.addActiveToken(uuid);
    }
}
</script>

<template>
    <div class="tool-detail" v-if="selected" :style="{ '--detailRight': detailRight, '--detailArrow': detailArrow }">
        <div
            v-for="token in tokens"
            :key="token.uuid"
            class="token"
            :class="{ selected: selection.includes(token.uuid) }"
            @click="toggle(token.uuid)"
        >
            <img :src="token.src" width="30px" height="30px" v-if="token.src" alt="" />
            <div>{{ token.name }}</div>
        </div>
    </div>
</template>

<style scoped>
.token {
    margin-bottom: 0.5em;
    padding: 0.3em;
    border: solid 2px #ff7052;
    background-color: rgba(255, 112, 82, 0.2);
    border-radius: 1em;
    display: flex;
    align-items: center;
}
.token > img {
    margin-right: 0.5em;
}
.token:last-child {
    margin-bottom: 0;
}
.selected {
    background-color: #ff7052;
    background-color: rgba(255, 112, 82, 0.7);
}
.selected:hover {
    cursor: pointer;
    background-color: rgba(255, 112, 82, 0.2);
}
.token:not(.selected):hover {
    background-color: rgba(255, 112, 82, 0.7);
    cursor: pointer;
}
</style>
