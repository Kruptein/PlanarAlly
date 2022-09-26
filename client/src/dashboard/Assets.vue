<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute } from "vue-router";
import type { RouteLocationNormalized } from "vue-router";

import AssetContextMenu from "../assetManager/AssetContext.vue";
import { openAssetContextMenu } from "../assetManager/context";
import { socket } from "../assetManager/socket";
import { assetStore } from "../assetManager/state";
import { changeDirectory, getIdImageSrc, showIdName } from "../assetManager/utils";
import { baseAdjust } from "../core/http";
import { useModal } from "../core/plugins/modals/plugin";
import { ctrlOrCmdPressed } from "../core/utils";

const { t } = useI18n();
const modals = useModal();
const route = useRoute();

const state = assetStore.state;
const body = document.getElementsByTagName("body")?.[0];
const parentFolder = assetStore.parentFolder;

const activeSelectionUrl = `url(${baseAdjust("/static/img/assetmanager/active_selection.png")})`;
const emptySelectionUrl = `url(${baseAdjust("/static/img/assetmanager/empty_selection.png")})`;

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

    body.addEventListener("dragenter", showDropZone);
    body.addEventListener("dragleave", hideDropZone);
});

onBeforeRouteLeave(() => {
    if (socket.connected) socket.disconnect();
    body.removeEventListener("dragenter", showDropZone);
    body.removeEventListener("dragleave", hideDropZone);
});

onBeforeRouteUpdate((to: RouteLocationNormalized) => {
    if (getCurrentPath(to.path) !== assetStore.currentFilePath.value) {
        loadFolder(getCurrentPath(to.path));
    }
});

const dragState = ref(0);

function showDropZone(): void {
    dragState.value++;
}

function hideDropZone(): void {
    dragState.value--;
}

async function createDirectory(): Promise<void> {
    const name = await modals.prompt(t("assetManager.AssetManager.new_folder_name"), "?");
    if (name !== undefined) {
        socket.emit("Folder.Create", { name, parent: assetStore.currentFolder.value });
    }
}

async function onDrop(event: DragEvent): Promise<void> {
    hideDropZone();
    if (event.dataTransfer && event.dataTransfer.items.length > 0) {
        await parseDirectoryUpload(
            [...event.dataTransfer.items].map((i) => i.webkitGetAsEntry()),
            assetStore.currentFolder.value,
        );
    }
}

function fsToFile(fl: FileSystemFileEntry): Promise<File> {
    return new Promise((resolve) => fl.file(resolve));
}

async function parseDirectoryUpload(
    fileSystemEntries: (FileSystemEntry | null)[],
    target: number,
    targetOffset: string[] = [],
): Promise<void> {
    const files: FileSystemFileEntry[] = [];
    for (const entry of fileSystemEntries) {
        if (entry === null) continue;
        if (entry.isDirectory) {
            const fwk = entry as FileSystemDirectoryEntry;
            const reader = fwk.createReader();
            reader.readEntries(async (entries) => parseDirectoryUpload(entries, target, [...targetOffset, entry.name]));
        } else if (entry.isFile) {
            files.push(entry as FileSystemFileEntry);
        }
    }
    if (files.length > 0) {
        const fileList = await Promise.all(files.map((f) => fsToFile(f)));
        console.log("Uploading", fileList, targetOffset);
        assetStore.upload(fileList as unknown as FileList, target, targetOffset);
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

function emptySelection(event: MouseEvent): void {
    // When shift or ctrl is pressed you are probably doing a selection operation,
    // but just misclicked. We don't want this to clear the selection on accident.
    if (event.shiftKey || ctrlOrCmdPressed(event)) return;
    assetStore.clearSelected();
}

function openContextMenu(event: MouseEvent, key: number): void {
    assetStore.clearSelected();
    assetStore.addSelectedInode(key);
    openAssetContextMenu(event);
}

let draggingSelection = false;

function startDrag(event: DragEvent, file: number): void {
    if (event.dataTransfer === null) return;
    event.dataTransfer.setData("Hack", "ittyHack");
    event.dataTransfer.dropEffect = "move";
    if (!state.selected.includes(file)) assetStore.addSelectedInode(file);
    draggingSelection = true;
}

function moveDrag(event: DragEvent): void {
    if ((event.target as HTMLElement).classList.contains("folder")) {
        (event.target as HTMLElement).classList.add("inode-selected");
    }
}

function leaveDrag(event: DragEvent): void {
    if ((event.target as HTMLElement).classList.contains("folder"))
        (event.target as HTMLElement).classList.remove("inode-selected");
}

function stopDrag(event: DragEvent, target: number): void {
    (event.target as HTMLElement).classList.remove("inode-selected");
    if (draggingSelection) {
        if (state.selected.includes(target)) return;
        if (target === parentFolder.value || target === state.root || state.folders.includes(target)) {
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
    dragState.value = 0;
}

function prepareUpload(): void {
    document.getElementById("files")!.click();
}

const upload = (): Promise<void> => assetStore.upload();

async function deleteSelection(): Promise<void> {
    if (assetStore.state.selected.length === 0) return;
    const result = await modals.confirm(t("assetManager.AssetContextMenu.ask_remove"));
    if (result === true) {
        assetStore.removeSelection();
    }
}
</script>

<template>
    <div id="content" @click="emptySelection">
        <div class="content-title">
            <span>MANAGE ASSETS</span>
            <div>
                <input id="files" type="file" multiple hidden @change="upload()" />
                <img
                    :src="baseAdjust('/static/img/assetmanager/create_folder.svg')"
                    @click.stop="createDirectory"
                    :title="t('assetManager.AssetManager.create_folder')"
                    :alt="t('assetManager.AssetManager.create_folder')"
                />
                <img
                    :src="baseAdjust('/static/img/assetmanager/add_file.svg')"
                    @click.stop="prepareUpload"
                    :title="t('assetManager.AssetManager.upload_files')"
                    :alt="t('assetManager.AssetManager.upload_files')"
                />
                <img
                    :src="baseAdjust('/static/img/assetmanager/delete_selection.svg')"
                    @click.stop="deleteSelection"
                    :title="t('common.remove')"
                    :alt="t('common.remove')"
                />
            </div>
        </div>
        <div id="path">
            <div @click="changeDirectory(state.root)">/</div>
            <div @click="changeDirectory(dir)" v-for="dir in state.folderPath" :key="dir">{{ showIdName(dir) }}</div>
        </div>
        <div id="assets" :class="{ dropzone: dragState > 0 }" @dragover.prevent @drop.prevent.stop="onDrop">
            <div
                class="inode folder"
                v-if="state.folderPath.length"
                @dblclick="changeDirectory(-1)"
                @dragover.prevent="moveDrag"
                @dragleave.prevent="leaveDrag"
                @drop.prevent.stop="stopDrag($event, parentFolder)"
                @mousedown.prevent
            >
                <font-awesome-icon icon="folder" style="font-size: 12.5em" />
                <div class="title">..</div>
            </div>
            <div
                class="inode folder"
                draggable="true"
                v-for="key in state.folders"
                :key="key"
                :class="{
                    'inode-selected': state.selected.includes(key),
                    'inode-not-selected': state.selected.length > 0 && !state.selected.includes(key),
                }"
                @click.stop="select($event, key)"
                @dblclick="changeDirectory(key)"
                @contextmenu.prevent="openContextMenu($event, key)"
                @dragstart="startDrag($event, key)"
                @dragover.prevent="moveDrag"
                @dragleave.prevent="leaveDrag"
                @drop.prevent.stop="stopDrag($event, key)"
            >
                <font-awesome-icon icon="folder" style="font-size: 12.5em" />
                <div class="title">{{ showIdName(key) }}</div>
            </div>
            <div
                class="inode file"
                draggable="true"
                v-for="file in state.files"
                :key="file"
                :class="{
                    'inode-selected': state.selected.includes(file),
                    'inode-not-selected': state.selected.length > 0 && !state.selected.includes(file),
                }"
                @click.stop="select($event, file)"
                @contextmenu.prevent="openContextMenu($event, file)"
                @dragstart="startDrag($event, file)"
            >
                <img :src="getIdImageSrc(file)" width="50" alt="" />
                <div class="title">{{ showIdName(file) }}</div>
            </div>
        </div>
    </div>
    <AssetContextMenu />
</template>

<style lang="scss">
#content + .ContextMenu ul {
    background: rgba(77, 0, 21);

    > li:hover {
        background: rgba(219, 0, 59, 1);
    }
}
</style>

<style scoped lang="scss">
#content {
    background-color: rgba(77, 59, 64, 0.6);
    border-radius: 20px;
    padding: 3.75rem;
    width: 100%;
    display: flex;
    flex-direction: column;

    .content-title {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 3.125em;
        color: white;
        border-bottom: 5px solid #ffa8bf;
        font-weight: bold;

        > div {
            display: flex;

            > img {
                &:hover {
                    cursor: pointer;
                }
            }
        }

        > span:last-child {
            color: #ffa8bf;

            &:hover {
                cursor: pointer;
            }
        }
    }

    #path {
        margin: 1rem 0;
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
        grid-template-columns: repeat(auto-fit, 12.5em);
        grid-auto-rows: min-content;
        gap: 4.5rem;
        height: inherit;
        margin-top: 0.875rem;
        padding-top: 1rem;
        overflow: visible;

        // border: solid 2px transparent;
        border: 5px dotted transparent;

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

            * {
                pointer-events: none; // prevent drag shenanigans
            }

            > img {
                width: 12.5rem;
                height: 12.5rem;
                object-fit: contain;
            }

            > .title {
                font-size: 1.5em;
                word-break: break-all;
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

        > .inode-not-selected::after {
            background-image: v-bind(emptySelectionUrl);
        }
    }
}
</style>
