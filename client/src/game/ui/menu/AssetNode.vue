<script setup lang="ts">
import { computed, defineProps, reactive } from "vue";

import { baseAdjust } from "../../../core/utils";

import type { AssetFile, AssetListMap } from "../../../core/models/types";
import type { PropType } from "vue";

interface State {
    hoveredHash: string;
}

const props = defineProps({
    assets: { type: Object as PropType<AssetListMap>, required: true },
});
const state: State = reactive({
    hoveredHash: "",
});

function childAssets(folder: string): AssetListMap {
    return props.assets.get(folder) as AssetListMap;
}

const files = computed(() => {
    const assetFiles = props.assets.get("__files") as AssetFile[] | undefined;
    return assetFiles?.concat() ?? [];
});

const folders = computed(() => {
    return [...props.assets.keys()].filter((el) => "__files" !== el);
});

function toggle(event: MouseEvent): void {
    const children = (event.target as HTMLLIElement).children;
    for (let i = 0; i < children.length; i++) {
        const el = children[i] as HTMLElement;
        el.style.display = el.style.display === "" ? "block" : "";
    }
}

function dragStart(event: DragEvent, imageSource: string, assetId: number): void {
    state.hoveredHash = "";
    if (event === null || event.dataTransfer === null) return;

    const img = (event.target as HTMLElement).querySelector(".preview")!;
    event.dataTransfer.setDragImage(img, 0, 0);
    event.dataTransfer.setData("text/plain", JSON.stringify({ imageSource, assetId }));
}
</script>

<template>
    <ul>
        <li v-for="folder in folders" :key="folder" class="folder" @click.stop="toggle">
            {{ folder }}
            <AssetNode :assets="childAssets(folder)" />
        </li>
        <li
            v-for="file in files"
            :key="file.id"
            class="file draggable token"
            draggable="true"
            @mouseover="state.hoveredHash = file.hash"
            @mouseout="state.hoveredHash = ''"
            @dragstart="dragStart($event, '/static/assets/' + file.hash, file.id)"
        >
            {{ file.name }}
            <div v-if="state.hoveredHash == file.hash" class="preview">
                <img class="asset-preview-image" :src="baseAdjust('/static/assets/' + file.hash)" alt="" />
            </div>
        </li>
    </ul>
</template>

<style scoped lang="scss">
.preview {
    position: fixed;
    left: 200px;
    top: 0;
}

.asset-preview-image {
    width: 100%;
    max-width: 250px;
}

.draggable {
    list-style: none;
    font-family: "HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", Helvetica, Arial, "Lucida Grande",
        sans-serif;
}

.token {
    /* padding: 5px 10px; */
    padding-top: 5px;
    padding-bottom: 5px;
    display: flex;
    align-items: center;
    justify-content: flex-start;

    img {
        margin-right: 5px;
    }

    svg {
        margin-left: auto;
    }
}

/*
DIRECTORY.CSS changes

* Collapse all folders by default, use js to toggle visibility on click.
* On hover over folder show some visual feedback
* On hover over file show the image

*/
.folder {
    > * {
        display: none;
    }

    &:hover {
        font-weight: bold;
        cursor: pointer;

        > * {
            font-weight: normal;
        }
    }
}

.directory {
    > .folder,
    > .file {
        display: block;
    }
}
</style>
