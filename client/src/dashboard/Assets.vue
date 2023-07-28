<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute } from "vue-router";
import type { RouteLocationNormalized } from "vue-router";

import { assetSystem } from "../assetManager";
import AssetContextMenu from "../assetManager/AssetContext.vue";
import { openAssetContextMenu } from "../assetManager/context";
import type { AssetId } from "../assetManager/models";
import { socket } from "../assetManager/socket";
import { assetState } from "../assetManager/state";
import { changeDirectory, getIdImageSrc, showIdName } from "../assetManager/utils";
import { baseAdjust } from "../core/http";
import { map } from "../core/iter";
import { useModal } from "../core/plugins/modals/plugin";
import { ctrlOrCmdPressed } from "../core/utils";

const { t } = useI18n();
const modals = useModal();
const route = useRoute();

const body = document.getElementsByTagName("body")[0];

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

    body?.addEventListener("dragenter", showDropZone);
    body?.addEventListener("dragleave", hideDropZone);
});

onBeforeRouteLeave(() => {
    if (socket.connected) socket.disconnect();
    body?.removeEventListener("dragenter", showDropZone);
    body?.removeEventListener("dragleave", hideDropZone);
});

onBeforeRouteUpdate((to: RouteLocationNormalized) => {
    if (getCurrentPath(to.path) !== assetState.currentFilePath.value) {
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
        socket.emit("Folder.Create", { name, parent: assetState.currentFolder.value });
    }
}

async function onDrop(event: DragEvent): Promise<void> {
    hideDropZone();
    const currentFolder = assetState.currentFolder.value;
    if (currentFolder && event.dataTransfer && event.dataTransfer.items.length > 0) {
        await parseDirectoryUpload(
            map(event.dataTransfer.items, (i) => i.webkitGetAsEntry()),
            currentFolder,
        );
    }
}

function fsToFile(fl: FileSystemFileEntry): Promise<File> {
    return new Promise((resolve) => fl.file(resolve));
}

async function parseDirectoryUpload(
    fileSystemEntries: Iterable<FileSystemEntry | null>,
    target: AssetId,
    newDirectories: string[] = [],
): Promise<void> {
    const files: FileSystemFileEntry[] = [];
    for (const entry of fileSystemEntries) {
        if (entry === null) continue;
        if (entry.isDirectory) {
            const fwk = entry as FileSystemDirectoryEntry;
            const reader = fwk.createReader();
            reader.readEntries(
                (entries) => void parseDirectoryUpload(entries, target, [...newDirectories, entry.name]),
            );
        } else if (entry.isFile) {
            files.push(entry as FileSystemFileEntry);
        }
    }
    if (files.length > 0) {
        const fileList = await Promise.all(files.map((f) => fsToFile(f)));
        await assetSystem.upload(fileList as unknown as FileList, { target, newDirectories });
    }
}

function select(event: MouseEvent, inode: AssetId): void {
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

function emptySelection(event: MouseEvent): void {
    // When shift or ctrl is pressed you are probably doing a selection operation,
    // but just misclicked. We don't want this to clear the selection on accident.
    if (event.shiftKey || ctrlOrCmdPressed(event)) return;
    assetSystem.clearSelected();
}

function openContextMenu(event: MouseEvent, key: AssetId): void {
    assetSystem.clearSelected();
    assetSystem.addSelectedInode(key);
    openAssetContextMenu(event);
}

let draggingSelection = false;

function startDrag(event: DragEvent, file: AssetId): void {
    if (event.dataTransfer === null) return;
    event.dataTransfer.setData("Hack", "ittyHack");
    event.dataTransfer.dropEffect = "move";
    if (!assetState.raw.selected.includes(file)) assetSystem.addSelectedInode(file);
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

async function stopDrag(event: DragEvent, target: AssetId): Promise<void> {
    (event.target as HTMLElement).classList.remove("inode-selected");
    if (draggingSelection) {
        if (assetState.raw.selected.includes(target)) return;
        if (
            target === assetState.parentFolder.value ||
            target === assetState.raw.root ||
            assetState.raw.folders.includes(target)
        ) {
            for (const inode of assetState.raw.selected) {
                assetSystem.moveInode(inode, target);
            }
        }
        assetSystem.clearSelected();
    } else if (event.dataTransfer && event.dataTransfer.items.length > 0) {
        await parseDirectoryUpload(
            map(event.dataTransfer.items, (i) => i.webkitGetAsEntry()),
            target,
        );
    }
    draggingSelection = false;
    dragState.value = 0;
}

function prepareUpload(): void {
    document.getElementById("files")!.click();
}

const upload = async (): Promise<void> => {
    const files = (document.getElementById("files") as HTMLInputElement).files;
    if (files !== null) await assetSystem.upload(files);
};

async function deleteSelection(): Promise<void> {
    if (assetState.raw.selected.length === 0) return;
    const result = await modals.confirm(t("assetManager.AssetContextMenu.ask_remove"));
    if (result === true) {
        assetSystem.removeSelection();
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
                    :title="t('assetManager.AssetManager.create_folder')"
                    :alt="t('assetManager.AssetManager.create_folder')"
                    @click.stop="createDirectory"
                />
                <img
                    :src="baseAdjust('/static/img/assetmanager/add_file.svg')"
                    :title="t('assetManager.AssetManager.upload_files')"
                    :alt="t('assetManager.AssetManager.upload_files')"
                    @click.stop="prepareUpload"
                />
                <img
                    :src="baseAdjust('/static/img/assetmanager/delete_selection.svg')"
                    :title="t('common.remove')"
                    :alt="t('common.remove')"
                    @click.stop="deleteSelection"
                />
            </div>
        </div>
        <div id="path">
            <div @click="changeDirectory(assetState.raw.root ?? 'POP')">/</div>
            <div v-for="dir in assetState.reactive.folderPath" :key="dir" @click="changeDirectory(dir)">
                {{ showIdName(dir) }}
            </div>
        </div>
        <div id="assets" :class="{ dropzone: dragState > 0 }" @dragover.prevent @drop.prevent.stop="onDrop">
            <div
                v-if="assetState.raw.folderPath.length && assetState.parentFolder.value"
                class="inode folder"
                @dblclick="changeDirectory('POP')"
                @dragover.prevent="moveDrag"
                @dragleave.prevent="leaveDrag"
                @drop.prevent.stop="stopDrag($event, assetState.parentFolder.value)"
                @mousedown.prevent
            >
                <font-awesome-icon icon="folder" style="font-size: 12.5em" />
                <div class="title">..</div>
            </div>
            <div
                v-for="key in assetState.reactive.folders"
                :key="key"
                class="inode folder"
                draggable="true"
                :class="{
                    'inode-selected': assetState.reactive.selected.includes(key),
                    'inode-not-selected':
                        assetState.reactive.selected.length > 0 && !assetState.reactive.selected.includes(key),
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
                v-for="file in assetState.reactive.files"
                :key="file"
                class="inode file"
                draggable="true"
                :class="{
                    'inode-selected': assetState.reactive.selected.includes(file),
                    'inode-not-selected':
                        assetState.reactive.selected.length > 0 && !assetState.reactive.selected.includes(file),
                }"
                @click.stop="select($event, file)"
                @contextmenu.prevent="openContextMenu($event, file)"
                @dragstart="startDrag($event, file)"
            >
                <img :src="getIdImageSrc(file)" width="50" alt="" />
                <div class="title">{{ showIdName(file) }}</div>
            </div>
        </div>
        <div
            v-show="
                assetState.reactive.expectedUploads > 0 &&
                assetState.reactive.expectedUploads !== assetState.reactive.resolvedUploads
            "
            id="progressbar"
        >
            <div id="progressbar-label">
                {{ t("assetManager.AssetManager.uploading") }} {{ assetState.reactive.resolvedUploads }} /
                {{ assetState.reactive.expectedUploads }}
            </div>
            <div id="progressbar-meter">
                <span
                    :style="{
                        width: (assetState.reactive.resolvedUploads / assetState.reactive.expectedUploads) * 100 + '%',
                    }"
                ></span>
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

#progressbar {
    position: sticky;
    bottom: 2rem;

    margin-top: 2rem;

    display: flex;
    flex-direction: row;

    border: solid 2px white;
    border-radius: 15px;
    overflow: hidden;

    #progressbar-label {
        padding: 10px 15px;
        background-color: rgba(137, 0, 37, 1);
        font-weight: bold;
    }

    #progressbar-meter {
        background-color: white;
        padding: 1px;
        flex-grow: 2;

        > span {
            display: block;
            height: 100%;
            position: relative;
            overflow: hidden;
            background-color: rgba(137, 0, 37, 1);
            background-image: linear-gradient(to bottom, rgba(137, 0, 37, 1) 37%, rgba(137, 0, 37, 1) 69%);
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
}
</style>
