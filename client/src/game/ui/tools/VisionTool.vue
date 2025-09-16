<script setup lang="ts">
import { computed } from "vue";

import type { LocalId } from "../../../core/id";
import { map } from "../../../core/iter";
import { getVisualShape } from "../../id";
import type { IShape } from "../../interfaces/shape";
import type { IAsset } from "../../interfaces/shapes/asset";
import { accessSystem } from "../../systems/access";
import { accessState } from "../../systems/access/state";
import { getProperties } from "../../systems/properties/state";
import { visionTool } from "../../tools/variants/vision";

const selected = visionTool.isActiveTool;

const tokens = computed(() =>
    [...map(accessState.reactive.ownedTokens.get("vision")!, (t) => getVisualShape(t)!)].filter(
        (sh) => !(sh.options.skipDraw ?? false),
    ),
);
const selection = computed(() => {
    const activeTokens = accessState.reactive.activeTokenFilters.get("vision");
    if (activeTokens) return activeTokens;
    return accessState.reactive.ownedTokens.get("vision")!;
});

function toggle(uuid: LocalId): void {
    if (selection.value.has(uuid)) accessSystem.removeActiveToken(uuid, "vision");
    else accessSystem.addActiveToken(uuid, "vision");
}

function getImageSrc(token: IShape): string {
    if (token.type === "assetrect") {
        return (token as IAsset).src;
    }
    return "";
}
</script>

<template>
    <div v-if="selected" class="tool-detail">
        <div
            v-for="token in tokens"
            :key="token.id"
            class="token"
            :class="{ selected: selection.has(token.id) }"
            @click="toggle(token.id)"
        >
            <img v-if="getImageSrc(token) !== ''" :src="getImageSrc(token)" width="30px" height="30px" alt="" />
            <div>{{ getProperties(token.id)!.name }}</div>
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

<style scoped lang="scss">
.tool-detail {
    display: block;
}
</style>
