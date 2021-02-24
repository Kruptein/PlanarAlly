<script lang="ts">
import Component from "vue-class-component";

import { layerManager } from "@/game/layers/manager";
import { gameStore } from "@/game/store";
import Tool from "@/game/ui/tools/Tool.vue";

import { Shape } from "../../shapes/shape";
import { Asset } from "../../shapes/variants/asset";

import { SelectFeatures } from "./SelectTool.vue";
import { ToolName, ToolPermission } from "./utils";

@Component
export default class VisionTool extends Tool {
    name = ToolName.Vision;
    active = false;

    get permittedTools(): ToolPermission[] {
        return [{ name: ToolName.Select, features: { disabled: [SelectFeatures.Resize, SelectFeatures.Rotate] } }];
    }

    get selection(): readonly string[] {
        return gameStore.activeTokens;
    }

    get tokens(): Shape[] {
        return gameStore.ownedtokens.map((t) => layerManager.UUIDMap.get(t)!);
    }

    toggle(uuid: string): void {
        if (this.selection.includes(uuid)) gameStore.removeActiveToken(uuid);
        else gameStore.addActiveToken(uuid);

        if (gameStore.activeTokens.length !== gameStore.ownedtokens.length) {
            this.alert = true;
        } else {
            this.alert = false;
        }
    }

    getImageSrc(token: Shape): string {
        if (token.type === "assetrect") {
            return (token as Asset).src;
        }
        return "";
    }
}
</script>

<template>
    <div class="tool-detail" v-if="selected" :style="{ '--detailRight': detailRight(), '--detailArrow': detailArrow }">
        <div
            v-for="token in tokens"
            :key="token.uuid"
            class="token"
            :class="{ selected: selection.includes(token.uuid) }"
            @click="toggle(token.uuid)"
        >
            <img :src="getImageSrc(token)" width="30px" height="30px" v-if="getImageSrc(token) !== ''" alt="" />
            <div>{{ token.name }}</div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.token {
    margin-bottom: 0.5em;
    padding: 0.3em;
    border: solid 2px #ff7052;
    background-color: rgba(255, 112, 82, 0.2);
    border-radius: 1em;
    display: flex;
    align-items: center;

    &:last-child {
        margin-bottom: 0;
    }

    &:not(.selected):hover {
        background-color: rgba(255, 112, 82, 0.7);
        cursor: pointer;
    }

    > img {
        margin-right: 0.5em;
    }
}

.selected {
    background-color: #ff7052;
    background-color: rgba(255, 112, 82, 0.7);

    &:hover {
        cursor: pointer;
        background-color: rgba(255, 112, 82, 0.2);
    }
}
</style>
