<script setup lang="ts">
import { type DeepReadonly, onMounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import { onBeforeRouteLeave, useRoute, useRouter } from "vue-router";

import type { ApiAsset } from "../apiTypes";
import { assetSystem } from "../assets";
import { sendCreateFolder } from "../assets/emits";
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
const router = useRouter();

watch(assetState.currentFilePath, async (newPath) => {
    await router.push(`/assets${newPath}`);
});

function getCurrentPath(path?: string): string {
    path ??= route.path;
    const i = path.indexOf("/assets");
    return path.slice(i + "/assets".length);
}

async function loadFolder(path: string): Promise<void> {
    if (socket.connected) {
        await assetSystem.loadFolder(path);
    } else {
        socket.connect();
        socket.once("connect", () => assetSystem.loadFolder(path));
    }
}

onMounted(async () => {
    await loadFolder(getCurrentPath());
});

onBeforeRouteLeave(() => {
    if (socket.connected) socket.disconnect();
});

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

        <AssetUploadProgress />
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
        margin-bottom: 1rem;

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

    #infobar {
        background: rgba(219, 0, 59, 1);
        border-radius: 1rem;
        padding: 1rem;
    }
}
</style>
