<script setup lang="ts">
import type { DeepReadonly } from "vue";
import { useI18n } from "vue-i18n";

import { assetSystem } from "..";
import type { ApiAsset } from "../../apiTypes";
import { baseAdjust } from "../../core/http";
import { useModal } from "../../core/plugins/modals/plugin";
import { coreStore } from "../../store/core";
import { sendCreateFolder } from "../emits";
import type { AssetId } from "../models";
import { assetState } from "../state";

const { t } = useI18n();
const modals = useModal();

async function createDirectory(): Promise<void> {
    const currentFolder = assetState.currentFolder.value;
    if (currentFolder === undefined || !canEdit(currentFolder)) return;
    const name = await modals.prompt(t("assetManager.AssetManager.new_folder_name"), "?");
    if (name !== undefined) {
        sendCreateFolder({ name, parent: currentFolder });
    }
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
</template>

<style scoped lang="scss">
img:hover {
    cursor: pointer;
}
</style>
