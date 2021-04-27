<script lang="ts">
import { computed, defineComponent, PropType, reactive, toRefs } from "vue";

import { AssetFile, AssetListMap } from "../../../core/models/types";
import { alphSort, baseAdjust } from "../../../core/utils";

interface State {
    empty: boolean;
    emptyFolders: string[];
    hoveredHash: string;
}

export default defineComponent({
    name: "AssetNode",
    props: {
        asset: { type: Object as PropType<AssetListMap>, required: true },
        name: String,
        search: { type: String, required: true },
    },
    setup(props, { emit }) {
        const state: State = reactive({
            empty: false,
            emptyFolders: [],
            hoveredHash: "",
        });

        // watch(
        //     () => props.search,
        //     () => {
        //         console.log(props.search);
        //         checkVisibility();
        //     },
        // );

        const files = computed(() => {
            const assetFiles = props.asset.get("__files") as AssetFile[] | undefined;
            return assetFiles?.concat() ?? [];
        });

        const filteredFiles = computed(() =>
            files.value
                .filter((f) => f.name.toLowerCase().includes(props.search.toLowerCase()))
                .sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1)),
        );

        const folders = computed(() => {
            return [...props.asset.keys()].filter((el) => "__files" !== el).sort(alphSort);
        });

        function checkVisibility(): void {
            const newEmpty = files.value.length === 0 && folders.value.length <= state.emptyFolders.length;
            if (!state.empty && newEmpty) {
                state.empty = true;
                emit("folderEmpty", props.name);
            } else if (state.empty && !newEmpty) {
                state.empty = false;
                emit("folderShow", props.name);
            }
        }

        function folderEmpty(name: string): void {
            state.emptyFolders.push(name);
            checkVisibility();
        }

        function folderShow(name: string): void {
            state.emptyFolders.splice(
                state.emptyFolders.findIndex((x) => x === name),
                1,
            );
            checkVisibility();
        }

        function toggle(event: { target: HTMLElement }): void {
            for (let i = 0; i < event.target.children.length; i++) {
                const el = event.target.children[i] as HTMLElement;
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

        return { ...toRefs(state), baseAdjust, dragStart, filteredFiles, folders, folderEmpty, folderShow, toggle };
    },
});
</script>

<template>
    <ul>
        <li
            v-for="folder in folders"
            :key="folder"
            class="folder"
            @click.stop="toggle"
            v-show="!emptyFolders.includes(folder)"
        >
            {{ folder }}
            <asset-node :asset="asset.get(folder)" :name="folder" :search="search"></asset-node>
        </li>
        <li
            v-for="file in filteredFiles"
            :key="file.id"
            class="file draggable token"
            draggable="true"
            @mouseover="hoveredHash = file.hash"
            @mouseout="hoveredHash = ''"
            @dragstart="dragStart($event, '/static/assets/' + file.hash, file.id)"
        >
            {{ file.name }}
            <div v-if="hoveredHash == file.hash" class="preview">
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
