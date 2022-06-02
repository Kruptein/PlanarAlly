<script setup lang="ts">
import { onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute } from "vue-router";
import type { RouteLocationNormalized } from "vue-router";

import { useModal } from "../core/plugins/modals/plugin";
import { ctrlOrCmdPressed } from "../core/utils";

import AssetContextMenu from "./AssetContext.vue";
import { openAssetContextMenu } from "./context";
import { socket } from "./socket";
import { assetStore } from "./state";
import { changeDirectory, getIdImageSrc, showIdName } from "./utils";

const route = useRoute();

assetStore.setModalActive(false);

function getCurrentPath(path?: string): string {
    path ??= route.path;
    const i = path.indexOf("/assets");
    return path.slice(i + "/assets".length);
}

function loadFolder(path: string): void {
    if (!socket.connected) socket.connect();
    socket.emit("Folder.GetByPath", path);
}

onMounted(() => {
    loadFolder(getCurrentPath());
});

onBeforeRouteLeave((_to, _from, next) => {
    socket.disconnect();
    next();
});

onBeforeRouteUpdate((to: RouteLocationNormalized) => {
    if (getCurrentPath(to.path) !== assetStore.currentFilePath.value) {
        loadFolder(getCurrentPath(to.path));
    }
});

const { t } = useI18n();
const modals = useModal();

const state = assetStore.state;

// DRAGGING

let draggingSelection = false;

function startDrag(event: DragEvent, file: number): void {
    if (event.dataTransfer === null) return;
    event.dataTransfer.setData("Hack", "ittyHack");
    event.dataTransfer.dropEffect = "move";
    if (!state.selected.includes(file)) assetStore.addSelectedInode(file);
    draggingSelection = true;
}

function moveDrag(event: DragEvent): void {
    if ((event.target as HTMLElement).classList.contains("folder"))
        (event.target as HTMLElement).classList.add("inode-selected");
}

function leaveDrag(event: DragEvent): void {
    if ((event.target as HTMLElement).classList.contains("folder"))
        (event.target as HTMLElement).classList.remove("inode-selected");
}

function stopDrag(event: DragEvent, target: number): void {
    (event.target as HTMLElement).classList.remove("inode-selected");
    if (draggingSelection) {
        if ((target === state.root || state.folders.includes(target)) && !state.selected.includes(target)) {
            for (const inode of state.selected) {
                assetStore.moveInode(inode, target);
            }
        }
        assetStore.clearSelected();
    } else if (event.dataTransfer && event.dataTransfer.items.length > 0) {
        parseDirectoryUpload(
            [...event.dataTransfer.items].map((i) => i.webkitGetAsEntry()),
            target,
        );
    }
    draggingSelection = false;
}

// eslint-disable-next-line no-undef
function fsToFile(fl: FileSystemFileEntry): Promise<File> {
    return new Promise((resolve) => fl.file(resolve));
}

async function parseDirectoryUpload(
    // eslint-disable-next-line no-undef
    fileSystemEntries: (FileSystemEntry | null)[],
    target: number,
    targetOffset: string[] = [],
): Promise<void> {
    // eslint-disable-next-line no-undef
    const files: FileSystemFileEntry[] = [];
    for (const entry of fileSystemEntries) {
        if (entry === null) continue;
        if (entry.isDirectory) {
            // eslint-disable-next-line no-undef
            const fwk = entry as FileSystemDirectoryEntry;
            const reader = fwk.createReader();
            reader.readEntries(async (entries) => parseDirectoryUpload(entries, target, [...targetOffset, entry.name]));
        } else if (entry.isFile) {
            // eslint-disable-next-line no-undef
            files.push(entry as FileSystemFileEntry);
        }
    }
    if (files.length > 0) {
        const fileList = await Promise.all(files.map((f) => fsToFile(f)));
        console.log("Uploading", fileList, targetOffset);
        assetStore.upload(fileList as unknown as FileList, target, targetOffset);
    }
}

// INODE MANAGEMENT

async function createDirectory(): Promise<void> {
    const name = await modals.prompt(t("assetManager.AssetManager.new_folder_name"), "?");
    if (name !== undefined) {
        socket.emit("Folder.Create", { name, parent: assetStore.currentFolder.value });
    }
}

function select(event: MouseEvent, inode: number): void {
    if (event.shiftKey && state.selected.length > 0) {
        const inodes = [...state.folders, ...state.files];
        const start = inodes.indexOf(state.selected.at(-1)!);
        const end = inodes.indexOf(inode);
        for (let i = start; i !== end; start < end ? i++ : i--) {
            if (i === start) continue;
            assetStore.addSelectedInode(inodes[i]);
        }
        assetStore.addSelectedInode(inodes[end]);
    } else {
        if (!ctrlOrCmdPressed(event)) {
            assetStore.clearSelected();
        }
        assetStore.addSelectedInode(inode);
    }
}

// VARIA

function exportData(): void {
    if (state.selected.length > 0) socket.emit("Asset.Export", state.selected);
}

function prepareUpload(): void {
    document.getElementById("files")!.click();
}

// ...toRefs(state),

const currentFolder = assetStore.currentFolder;
const parentFolder = assetStore.parentFolder;
const upload = (): Promise<void> => assetStore.upload();
</script>

<template>
    <div id="AssetManager" v-cloak>
        <div id="titlebar">{{ t("assetManager.AssetManager.title") }}</div>
        <div id="progressbar" v-show="state.expectedUploads > 0 && state.expectedUploads !== state.resolvedUploads">
            <div id="progressbar-label">
                {{ t("assetManager.AssetManager.uploading") }} {{ state.resolvedUploads }} / {{ state.expectedUploads }}
            </div>
            <div id="progressbar-meter">
                <span :style="{ width: (state.resolvedUploads / state.expectedUploads) * 100 + '%' }"></span>
            </div>
        </div>
        <div id="assets" @dragover.prevent="moveDrag" @drop.prevent.stop="stopDrag($event, currentFolder)">
            <div id="breadcrumbs">
                <div>/</div>
                <div v-for="dir in state.folderPath" :key="dir">{{ showIdName(dir) }}</div>
            </div>
            <div id="actionbar">
                <input id="files" type="file" multiple hidden @change="upload()" />
                <div @click="createDirectory" :title="t('assetManager.AssetManager.create_folder')">
                    <font-awesome-icon icon="plus-square" />
                </div>
                <div @click="prepareUpload" :title="t('assetManager.AssetManager.upload_files')">
                    <font-awesome-icon icon="upload" />
                </div>
                <div @click="exportData" :title="t('assetManager.AssetManager.download_files')">
                    <font-awesome-icon icon="download" />
                </div>
            </div>
            <div id="explorer">
                <div
                    class="inode folder"
                    v-if="state.folderPath.length"
                    @dblclick="changeDirectory(-1)"
                    @dragover.prevent="moveDrag"
                    @dragleave.prevent="leaveDrag"
                    @drop.prevent.stop="stopDrag($event, parentFolder)"
                >
                    <font-awesome-icon icon="folder" style="font-size: 50px" />
                    <div class="title">..</div>
                </div>
                <div
                    class="inode folder"
                    draggable="true"
                    v-for="key in state.folders"
                    :key="key"
                    :class="{ 'inode-selected': state.selected.includes(key) }"
                    @click="select($event, key)"
                    @contextmenu.prevent="
                        select($event, key);
                        openAssetContextMenu($event);
                    "
                    @dblclick="changeDirectory(key)"
                    @dragstart="startDrag($event, key)"
                    @dragover.prevent="moveDrag"
                    @dragleave.prevent="leaveDrag"
                    @drop.prevent.stop="stopDrag($event, key)"
                >
                    <font-awesome-icon icon="folder" style="font-size: 50px" />
                    <div class="title">{{ showIdName(key) }}</div>
                </div>
                <div
                    class="inode file"
                    draggable="true"
                    v-for="file in state.files"
                    :key="file"
                    :class="{ 'inode-selected': state.selected.includes(file) }"
                    @click="select($event, file)"
                    @contextmenu.prevent="
                        select($event, file);
                        openAssetContextMenu($event);
                    "
                    @dragstart="startDrag($event, file)"
                >
                    <img :src="getIdImageSrc(file)" width="50" alt="" />
                    <div class="title">{{ showIdName(file) }}</div>
                </div>
            </div>
        </div>
        <AssetContextMenu />
    </div>
</template>

<style lang="scss">
[v-cloak],
[v-cloak] * {
    display: none;
}

html,
body {
    padding: 0;
    margin: 0;
    width: 100%;
    height: 100%;
    font-family: "Open Sans", sans-serif;
}

#AssetManager {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
}

#titlebar {
    padding: 15px;
    margin: 10px;
    font-size: 30px;
    font-weight: bold;
    background-color: #ff7052;
    color: #fff;
    text-align: center;
    border: solid 1px black;
    box-shadow: 2px 2px gray;
}

#progressbar {
    margin: 10px;
    display: flex;
    flex-direction: row;
    border: solid 1px black;
    box-shadow: 2px 2px gray;
}

#progressbar-label {
    padding: 10px 15px;
    background-color: #ff7052;
}

#progressbar-meter {
    background-color: white;
    padding: 5px;
    flex-grow: 2;

    > span {
        display: block;
        height: 100%;
        position: relative;
        overflow: hidden;
        /* background-color: #ff7052;
    background-image: linear-gradient(center bottom, #ff7052 37%, white 69%); */
        background-color: #ff7052;
        background-image: linear-gradient(to bottom, #ff7052 37%, #ff7052 69%);
        box-shadow: inset 0 2px 9px rgba(255, 255, 255, 0.3), inset 0 -2px 6px rgba(0, 0, 0, 0.4);

        &:after {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            bottom: 0;
            right: 0;
            background-image: linear-gradient(
                -45deg,
                rgba(255, 255, 255, 0.2) 25%,
                transparent 25%,
                transparent 50%,
                rgba(255, 255, 255, 0.2) 50%,
                rgba(255, 255, 255, 0.2) 75%,
                transparent 75%,
                transparent
            );
            z-index: 1;
            background-size: 50px 50px;
            overflow: hidden;
            animation: move 2s linear infinite;
        }
    }
}

@keyframes move {
    0% {
        background-position: 0 0;
    }
    100% {
        background-position: 50px 50px;
    }
}

#assets,
#asset-details {
    background-color: white;
    border: solid 1px black;
    margin: 10px;
    position: relative;
    padding-top: 45px;
    padding-bottom: 45px;
    box-shadow: 3px 3px gray;
}

#assets {
    flex-grow: 1;
}

#asset-details {
    display: flex;
    flex-direction: column;
    padding: 15px;
    max-width: 50%;
    overflow: scroll;

    img {
        width: 100%;
    }
}

#breadcrumbs {
    position: absolute;
    left: 0;
    top: 0;
    display: flex;
    overflow: hidden;
    z-index: 1;
    background-color: #ff7052;
    color: white;
    align-items: center;
    padding: 5px;
    border-bottom-right-radius: 10px;

    > div {
        position: relative;
        padding: 10px;
        padding-left: 20px;
        text-align: center;

        &:first-child {
            padding-left: 10px;
        }
    }

    div {
        &:last-child::after {
            content: none;
        }

        &::after {
            content: "";
            position: absolute;
            display: inline-block;
            width: 30px;
            height: 30px;
            top: 3px;
            right: -10px;
            background-color: transparent;
            border-top-right-radius: 5px;
            -webkit-transform: scale(0.707) rotate(45deg);
            transform: scale(0.707) rotate(45deg);
            box-shadow: 1px -1px rgba(0, 0, 0, 0.25);
            z-index: 1;
        }
    }
}

#actionbar {
    position: absolute;
    right: 0;
    top: 0;
    padding: 8px;
    border-bottom-left-radius: 10px;
    background-color: #ff7052;
    display: flex;
    justify-content: center;
    align-items: center;
    color: white;

    > div {
        margin: 5px;

        &:hover {
            cursor: pointer;
        }
    }
}

#explorer {
    position: relative;
    left: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(105px, 1fr));
    max-width: 100%;
    max-height: 100%;
    overflow: auto;
}

.inode {
    user-select: none;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 15px;

    * {
        pointer-events: none;
    }
}

.inode:hover,
.inode-selected {
    cursor: pointer;
    background-color: #ff7052;
}
.title {
    word-break: break-all;
}

#asset-detail-title {
    font-weight: bold;
    font-size: 30px;
    border-bottom: solid 2px black;
    margin-bottom: 15px;
    text-align: center;
}
</style>
