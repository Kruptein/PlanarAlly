<script setup lang="ts">
import trimEnd from "lodash/trimEnd";
import { type DeepReadonly, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute } from "vue-router";
import type { RouteLocationNormalized } from "vue-router";

import type { ApiAsset } from "../apiTypes";
import { assetSystem } from "../assets";
import { sendCreateFolder, sendFolderGetByPath } from "../assets/emits";
import type { AssetId } from "../assets/models";
import { socket } from "../assets/socket";
import { assetState } from "../assets/state";
import AssetListCore from "../assets/ui/AssetListCore.vue";
import { baseAdjust } from "../core/http";
import { useModal } from "../core/plugins/modals/plugin";
import { ctrlOrCmdPressed } from "../core/utils";
import { coreStore } from "../store/core";

const { t } = useI18n();
const modals = useModal();
const route = useRoute();

const body = document.getElementsByTagName("body")[0];

function getCurrentPath(path?: string): string {
    path ??= route.path;
    const i = path.indexOf("/assets");
    return path.slice(i + "/assets".length);
}

function loadFolder(path: string): void {
    if (!socket.connected) socket.connect();
    sendFolderGetByPath(path);
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
    if (trimEnd(getCurrentPath(to.path), "/") !== trimEnd(assetState.currentFilePath.value, "/")) {
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
    const currentFolder = assetState.currentFolder.value;
    if (currentFolder === undefined || !canEdit(currentFolder)) return;
    const name = await modals.prompt(t("assetManager.AssetManager.new_folder_name"), "?");
    if (name !== undefined) {
        sendCreateFolder({ name, parent: currentFolder });
    }
}

function emptySelection(event: MouseEvent): void {
    // When shift or ctrl is pressed you are probably doing a selection operation,
    // but just misclicked. We don't want this to clear the selection on accident.
    if (event.shiftKey || ctrlOrCmdPressed(event)) return;
    assetSystem.clearSelected();
}

function prepareUpload(): void {
    if (!canEdit(assetState.currentFolder.value)) return;
    document.getElementById("files")!.click();
}

const upload = async (): Promise<void> => {
    if (!canEdit(assetState.currentFolder.value)) return;
    const files = (document.getElementById("files") as HTMLInputElement).files;
    if (files !== null) await assetSystem.upload(files);
};

async function deleteSelection(): Promise<void> {
    if (!canEdit(assetState.currentFolder.value)) return;
    if (assetState.raw.selected.length === 0) return;
    const result = await modals.confirm(t("assetManager.AssetContextMenu.ask_remove"));
    if (result === true) {
        assetSystem.removeSelection();
    }
}

function canEdit(data: AssetId | DeepReadonly<ApiAsset> | undefined, includeRootShare = true): boolean {
    if (data === undefined) return false; // We accept undefined to alleviate awkward type checks in callers
    let asset: DeepReadonly<ApiAsset> | undefined;
    if (data instanceof Object && "id" in data) asset = data;
    else asset = assetState.raw.idMap.get(data);

    if (asset === undefined) return false;

    if (assetState.raw.sharedRight === "view") return false;

    if (includeRootShare) {
        const username = coreStore.state.username;
        if (asset === undefined) return false;
        if (asset.owner !== username && !asset.shares.some((s) => s.user === username && s.right === "edit"))
            return false;
    }
    return true;
}
</script>

<template>
    <div id="content" @click="emptySelection">
        <div class="content-title">
            <span>MANAGE ASSETS</span>
            <div v-show="assetState.reactive.sharedRight !== 'view'">
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

        <AssetListCore font-size="12em" />

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
</template>

<style lang="scss">
.ContextMenu ul {
    background: rgba(77, 0, 21);

    box-shadow: 0 0 1rem rgba(77, 0, 21, 0.5);

    li:hover {
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

    // #path {
    //     margin: 1rem 0;
    //     display: flex;

    //     // credit: https://stackoverflow.com/questions/46755021/how-to-create-css-breadcrumbs-with-clip-path
    //     > div {
    //         padding: 3px 20px;
    //         background-color: #666;
    //         color: white;
    //         display: inline-block;
    //         clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%, 10px 50%);

    //         &:hover {
    //             cursor: pointer;
    //         }
    //     }
    // }

    #infobar {
        background: rgba(219, 0, 59, 1);
        border-radius: 1rem;
        padding: 1rem;
    }

    // #assets {
    //     display: grid;
    //     grid-template-columns: repeat(auto-fit, 12.5em);
    //     grid-auto-rows: min-content;
    //     gap: 4.5rem;
    //     height: inherit;
    //     margin-top: 0.875rem;
    //     padding-top: 1rem;
    //     overflow: visible;

    //     // border: solid 2px transparent;
    //     border: 5px dotted transparent;

    //     user-select: none;

    //     &.dropzone {
    //         border-color: #ffa8bf;
    //     }

    //     > .inode {
    //         position: relative;
    //         display: flex;
    //         flex-direction: column;
    //         align-items: center;

    //         &:hover {
    //             cursor: pointer;
    //         }

    //         > img {
    //             width: 12.5rem;
    //             height: 12.5rem;
    //             object-fit: contain;
    //         }

    //         > .title {
    //             font-size: 1.5em;
    //             word-break: break-all;
    //         }

    //         > .asset-link {
    //             font-size: 2em;
    //             position: absolute;
    //             left: 0.25rem;
    //             top: 0.25rem;
    //             color: white;

    //             :deep(> path) {
    //                 stroke: black;
    //                 stroke-width: 1.5rem;
    //             }
    //         }
    //     }

    //     > .inode-not-selected::after,
    //     > .inode-selected::after {
    //         position: absolute;
    //         top: 0;
    //         right: -0.5rem;
    //         background-size: 3.125rem 3.125rem;
    //         content: "";
    //         width: 3.125rem;
    //         height: 3.125rem;
    //     }

    //     > .inode-selected::after {
    //         background-image: v-bind(activeSelectionUrl);
    //     }

    //     > .inode-not-selected::after {
    //         background-image: v-bind(emptySelectionUrl);
    //     }
    // }
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
            box-shadow:
                inset 0 2px 9px rgba(255, 255, 255, 0.3),
                inset 0 -2px 6px rgba(0, 0, 0, 0.4);

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
