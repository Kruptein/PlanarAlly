<script setup lang="ts">
import { computed, reactive, ref } from "vue";

import type { AssetId } from "../../../assets/models";
import { getImageSrcFromHash } from "../../../assets/utils";
import { filter } from "../../../core/iter";
import type { AssetFile, AssetListMap } from "../../../core/models/types";

interface State {
    hoveredHash: string;
    openFolders: Set<string>;
}

const props = defineProps<{ assets: AssetListMap; visible: boolean }>();
const state: State = reactive({
    hoveredHash: "",
    openFolders: new Set(),
});

const thumbnailMisses = ref(new Set<AssetId>());

function childAssets(folder: string): AssetListMap {
    return props.assets.get(folder) as AssetListMap;
}

const files = computed(() => {
    const assetFiles = props.assets.get("__files") as AssetFile[] | undefined;
    return assetFiles?.concat() ?? [];
});

const folders = computed(() => {
    return [...filter(props.assets.keys(), (el) => "__files" !== el)];
});

function toggle(folder: string): void {
    if (state.openFolders.has(folder)) {
        state.openFolders.delete(folder);
    } else {
        state.openFolders.add(folder);
    }
}

function dragStart(event: DragEvent, assetHash: string, assetId: number): void {
    state.hoveredHash = "";
    if (event.dataTransfer === null) return;

    const img = (event.target as HTMLElement).querySelector(".preview")!;
    event.dataTransfer.setDragImage(img, 0, 0);
    event.dataTransfer.setData("text/plain", JSON.stringify({ assetHash, assetId }));
}
</script>

<template>
    <ul v-if="visible">
        <li v-for="folder in folders" :key="folder" class="folder" @click.stop="toggle(folder)">
            {{ folder }}
            <AssetNode :assets="childAssets(folder)" :visible="state.openFolders.has(folder)" />
        </li>
        <li
            v-for="file in files"
            :key="file.id"
            class="file draggable token"
            draggable="true"
            @mouseover="state.hoveredHash = file.hash"
            @mouseout="state.hoveredHash = ''"
            @dragstart="dragStart($event, file.hash, file.id)"
        >
            {{ file.name }}
            <div v-if="state.hoveredHash == file.hash" class="preview">
                <picture v-if="!thumbnailMisses.has(file.id)">
                    <source :srcset="getImageSrcFromHash(file.hash, { thumbnailFormat: 'webp' })" type="image/webp" />
                    <source :srcset="getImageSrcFromHash(file.hash, { thumbnailFormat: 'jpeg' })" type="image/jpeg" />
                    <img alt="" loading="lazy" class="asset-preview-image" @error="thumbnailMisses.add(file.id)" />
                </picture>
                <img v-else :src="getImageSrcFromHash(file.hash)" alt="" loading="lazy" class="asset-preview-image" />
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
