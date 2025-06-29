<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import type { DeepReadonly } from "vue";

import { assetSystem } from "..";
import type { ApiAsset } from "../../apiTypes";
import type { Section } from "../../core/components/contextMenu/types";
import { baseAdjust } from "../../core/http";
import { ctrlOrCmdPressed } from "../../core/utils";
import { coreStore } from "../../store/core";
import type { AssetId } from "../models";
import { assetState } from "../state";
import { getImageSrcFromAssetId } from "../utils";

import { canEdit } from "./access";
import AssetContextMenu from "./AssetContext.vue";
import { useAssetContextMenu } from "./context";
import { useDrag } from "./drag";

const activeSelectionUrl = `url(${baseAdjust("/static/img/assetmanager/active_selection.png")})`;

const emit = defineEmits<(e: "onDragEnd" | "onDragLeave" | "onDragStart", value: DragEvent) => void>();
const props = withDefaults(
    defineProps<{
        extraContextSections?: Section[];
        fontSize: string;
        searchResults?: ApiAsset[];
        onlyFiles?: boolean;
        disableMulti?: boolean;
    }>(),
    {
        extraContextSections: () => [],
        searchResults: () => [],
        onlyFiles: false,
        disableMulti: false,
    },
);

const assetContextMenu = useAssetContextMenu();
const drag = useDrag(emit);
// const route = useRoute();

const thumbnailMisses = ref(new Set<AssetId>());

// const body = document.getElementsByTagName("body")[0];
const contextTargetElement = ref<HTMLElement | null>(null);
const currentRenameAsset = ref<AssetId | null>(null);

const folders = computed(() => {
    if (props.searchResults.length > 0) {
        return props.searchResults.filter((r) => r.fileHash === null);
    }
    return assetState.reactive.folders.map((f) => assetState.reactive.idMap.get(f)!);
});
const files = computed(() => {
    if (props.searchResults.length > 0) {
        return props.searchResults.filter((r) => r.fileHash !== null);
    }
    return assetState.reactive.files.map((f) => assetState.reactive.idMap.get(f)!);
});

function dragStart(event: DragEvent, file: AssetId, assetHash: string | null): void {
    // emit("onDragStart", event);
    drag.startDrag(event, file, assetHash);
}

function isShared(asset: DeepReadonly<ApiAsset>): boolean {
    return (
        asset.shares.length > 0 || (asset.owner !== coreStore.state.username && assetState.raw.sharedParent === null)
    );
}

function select(event: MouseEvent, inode: AssetId): void {
    if (!canEdit(inode, false)) {
        return;
    }

    if (props.onlyFiles && folders.value.some((f) => f.id === inode)) {
        assetSystem.clearSelected();
        return;
    }

    if (props.disableMulti) assetSystem.clearSelected();

    if (event.shiftKey && assetState.raw.selected.length > 0) {
        const inodes = [...assetState.raw.folders, ...assetState.raw.files];
        const start = inodes.indexOf(assetState.raw.selected.at(-1)!);
        const end = inodes.indexOf(inode);
        for (let i = start; i !== end; start < end ? i++ : i--) {
            if (i === start) continue;
            assetSystem.addSelectedInode(inodes[i]!);
        }
        assetSystem.addSelectedInode(inodes[end]!);
    } else {
        if (!ctrlOrCmdPressed(event)) {
            assetSystem.clearSelected();
        }
        assetSystem.addSelectedInode(inode);
    }
}

function renameAsset(event: FocusEvent, file: AssetId, oldName: string): void {
    if (!canEdit(file, false)) {
        return;
    }

    const target = event.target as HTMLElement;
    if (target.textContent === null) {
        target.textContent = oldName;
        currentRenameAsset.value = null;
        return;
    }
    const name = target.textContent.trim();

    if (name === undefined || name === "" || name === "..") {
        target.textContent = oldName;
    } else if (name !== oldName) {
        assetSystem.renameAsset(file, name);
    }
    currentRenameAsset.value = null;
}

function openContextMenu(event: MouseEvent, key: AssetId): void {
    if (!canEdit(key, false)) {
        return;
    }

    // event is generated by the parent element containing both the image/icon and
    // the name of the asset. We only want to operate on the name, so we have to
    // get the child element with the 'title' class
    const parent = event.currentTarget as HTMLElement;
    contextTargetElement.value = parent.querySelector(":scope > .title");

    if (!assetState.raw.selected.includes(key)) {
        assetSystem.clearSelected();
        assetSystem.addSelectedInode(key);
    }
    assetContextMenu.open(event);
}

function selectElementContents(el: HTMLElement): void {
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
    }
}

async function showRenameUI(id: AssetId): Promise<void> {
    const el = contextTargetElement.value;
    contextTargetElement.value = null;
    if (el) {
        currentRenameAsset.value = id;
        await nextTick(() => {
            el.focus();
            selectElementContents(el);
        });
    }
}
</script>

<template>
    <section id="assets-list" v-bind="$attrs">
        <div id="path">
            <template v-if="searchResults.length === 0">
                <div @click="assetSystem.changeDirectory(assetState.raw.root ?? 'POP')">/</div>
                <div
                    v-for="dir in assetState.reactive.folderPath"
                    :key="dir.id"
                    @click="assetSystem.changeDirectory(dir.id)"
                >
                    {{ dir.name }}
                </div>
            </template>
            <div v-else>{{ searchResults.length }} Results</div>
        </div>
        <div v-if="assetState.reactive.sharedParent" id="infobar">
            You are browsing files that are part of a shared folder with you
        </div>
        <div
            id="assets"
            :class="{ dropzone: drag.dropZoneVisible.value > 0 }"
            @dragleave="emit('onDragLeave', $event)"
            @dragover.prevent
            @drop.prevent.stop="drag.onDrop"
            @scroll="assetContextMenu.close"
        >
            <div
                v-if="assetState.raw.folderPath.length && assetState.parentFolder.value && searchResults.length === 0"
                class="inode folder"
                @dblclick="assetSystem.changeDirectory('POP')"
                @dragover.prevent="drag.moveDrag"
                @dragleave.prevent="drag.leaveDrag"
                @drop.prevent.stop="drag.stopDrag($event, assetState.parentFolder.value!)"
                @mousedown.prevent
            >
                <font-awesome-icon icon="folder" :style="{ fontSize: props.fontSize }" />
                <font-awesome-icon icon="folder-open" :style="{ fontSize: props.fontSize }" />
                <div class="title">..</div>
            </div>
            <div
                v-for="folder of folders"
                :key="folder.id"
                class="inode folder"
                :draggable="assetState.reactive.sharedRight !== 'view'"
                :class="{
                    'inode-selected': assetState.reactive.selected.includes(folder.id),
                    'inode-not-selected':
                        assetState.reactive.selected.length > 0 && !assetState.reactive.selected.includes(folder.id),
                }"
                @click.stop="select($event, folder.id)"
                @dblclick="assetSystem.changeDirectory(folder.id)"
                @contextmenu.prevent="openContextMenu($event, folder.id)"
                @dragstart="drag.startDrag($event, folder.id, null)"
                @dragover.prevent="drag.moveDrag"
                @dragend="drag.onDragEnd"
                @dragleave.prevent="drag.leaveDrag"
                @drop.prevent.stop="drag.stopDrag($event, folder.id)"
            >
                <font-awesome-icon v-if="isShared(folder)" icon="user-tag" class="asset-link" />
                <font-awesome-icon icon="folder" :style="{ fontSize: props.fontSize }" />
                <font-awesome-icon icon="folder-open" :style="{ fontSize: props.fontSize }" />
                <div
                    :contenteditable="folder.id === currentRenameAsset"
                    class="title"
                    @keydown.enter="($event!.target as HTMLElement).blur()"
                    @blur="renameAsset($event, folder.id, folder.name)"
                >
                    {{ folder.name }}
                </div>
            </div>
            <div
                v-for="file of files"
                :key="file.id"
                class="inode file"
                :draggable="assetState.reactive.sharedRight !== 'view'"
                :class="{
                    'inode-selected': assetState.reactive.selected.includes(file.id),
                    'inode-not-selected':
                        assetState.reactive.selected.length > 0 && !assetState.reactive.selected.includes(file.id),
                }"
                @click.stop="select($event, file.id)"
                @contextmenu.prevent="openContextMenu($event, file.id)"
                @dragstart="dragStart($event, file.id, file.fileHash)"
                @dragend="drag.onDragEnd"
            >
                <font-awesome-icon v-if="isShared(file)" icon="user-tag" class="asset-link" />
                <picture v-if="!thumbnailMisses.has(file.id)">
                    <source :srcset="getImageSrcFromAssetId(file.id, { thumbnailFormat: 'webp' })" type="image/webp" />
                    <source :srcset="getImageSrcFromAssetId(file.id, { thumbnailFormat: 'jpeg' })" type="image/jpeg" />
                    <img alt="" loading="lazy" @error="thumbnailMisses.add(file.id)" />
                </picture>
                <img v-else :src="getImageSrcFromAssetId(file.id)" alt="" loading="lazy" />
                <div
                    :contenteditable="file.id === currentRenameAsset"
                    class="title"
                    @keydown.enter="($event!.target as HTMLElement).blur()"
                    @blur="renameAsset($event, file.id, file.name)"
                >
                    {{ file.name }}
                </div>
            </div>
            <div v-if="assetState.reactive.loadingFolder" id="assets-loading-overlay">
                <div class="loader"></div>
                <div>Fetching data...</div>
            </div>
        </div>
    </section>
    <AssetContextMenu
        v-bind="assetContextMenu.state"
        :extra-sections="extraContextSections"
        @close="assetContextMenu.close"
        @rename="showRenameUI"
    />
</template>

<style scoped lang="scss">
#assets-list {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    position: relative;

    #path {
        display: flex;

        // credit: https://stackoverflow.com/questions/46755021/how-to-create-css-breadcrumbs-with-clip-path
        > div {
            padding: 3px 20px;
            background-color: #666;
            color: white;
            display: inline-block;
            clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%, 10px 50%);

            &:hover {
                cursor: pointer;
            }
        }
    }

    #assets {
        display: grid;
        grid-template-columns: repeat(auto-fit, v-bind("fontSize"));
        grid-auto-rows: min-content;
        gap: 2.5rem;
        margin-top: 0.875rem;
        padding-top: 1rem;

        position: relative;
        overflow-x: hidden;
        overflow-y: auto;

        // border: solid 2px transparent;
        border: 5px dotted transparent;

        user-select: none;

        &.dropzone {
            border-color: #ffa8bf;
        }

        > .inode {
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;

            &:hover {
                cursor: pointer;
            }

            > img,
            > picture > img {
                width: 6.5rem;
                height: 6.5rem;
                object-fit: contain;
                // The below is purely to prevent a random chrome bug,
                // where the setDragImage passed image is often ignored
                transform: translate3d(0, 0, 0);
            }

            > .title {
                font-size: 1.5em;
                word-break: break-all;
            }

            > .asset-link {
                font-size: 2em;
                position: absolute;
                left: 0.25rem;
                top: 0.25rem;
                color: white;

                :deep(> path) {
                    stroke: black;
                    stroke-width: 1.5rem;
                }
            }
        }

        .fa-folder-open {
            display: none;
        }

        > .inode-hovered {
            .fa-folder {
                display: none;
            }

            .fa-folder-open {
                display: block;
                margin-left: 1rem;
            }
        }

        > .inode-not-selected::after,
        > .inode-selected::after {
            position: absolute;
            top: 0;
            right: -0.5rem;
            background-size: 3.125rem 3.125rem;
            content: "";
            width: 3.125rem;
            height: 3.125rem;
        }

        > .inode-selected::after {
            background-image: v-bind(activeSelectionUrl);
        }
    }
}

#assets-loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;

    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    background-color: rgba(255, 255, 255, 0.75);
    .loader {
        display: inline-block;
        width: 2rem;
        height: 2rem;

        border: 5px solid #a82929;
        border-bottom-color: transparent;
        border-radius: 50%;

        animation: rotation 1s linear infinite;
    }

    @keyframes rotation {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    }
}
</style>
