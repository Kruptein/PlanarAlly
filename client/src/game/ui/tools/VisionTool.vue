<script setup lang="ts">
import type { CSSProperties } from "vue";
import { computed, onMounted, ref } from "vue";

import { getShape } from "../../id";
import type { LocalId } from "../../id";
import type { IShape } from "../../interfaces/shape";
import type { IAsset } from "../../interfaces/shapes/asset";
import { accessSystem } from "../../systems/access";
import { accessState } from "../../systems/access/state";
import { visionTool } from "../../tools/variants/vision";

import { useToolPosition } from "./toolPosition";

const right = ref("0px");
const arrow = ref("0px");

const selected = visionTool.isActiveTool;
const toolStyle = computed(() => ({ "--detailRight": right.value, "--detailArrow": arrow.value } as CSSProperties));

onMounted(() => {
    ({ right: right.value, arrow: arrow.value } = useToolPosition(visionTool.toolName));
});

const tokens = computed(() => [...accessState.$.ownedTokens].map((t) => getShape(t)!));
const selection = computed(() => {
    if (accessState.$.activeTokenFilters === undefined) return accessState.$.ownedTokens;
    return accessState.$.activeTokenFilters;
});

function toggle(uuid: LocalId): void {
    if (selection.value.has(uuid)) accessSystem.removeActiveToken(uuid);
    else accessSystem.addActiveToken(uuid);
}

function getImageSrc(token: IShape): string {
    if (token.type === "assetrect") {
        return (token as IAsset).src;
    }
    return "";
}
</script>

<template>
    <div class="tool-detail" v-if="selected" :style="toolStyle">
        <div
            v-for="token in tokens"
            :key="token.id"
            class="token"
            :class="{ selected: selection.has(token.id) }"
            @click="toggle(token.id)"
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

<style scoped lang="scss">
.tool-detail {
    display: block;
}
</style>
