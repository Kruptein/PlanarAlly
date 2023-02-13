<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import ContextMenu from "../core/components/ContextMenu.vue";
import { useModal } from "../core/plugins/modals/plugin";

import { assetContextLeft, assetContextTop, showAssetContextMenu } from "./context";
import { assetStore } from "./state";

const cm = ref<{ $el: HTMLDivElement } | null>(null);
const modals = useModal();
const { t } = useI18n();

onMounted(() => {
    window.addEventListener("scroll", close);
});

onUnmounted(() => {
    window.removeEventListener("scroll", close);
});

watch(showAssetContextMenu, async () => {
    if (showAssetContextMenu.value) {
        await nextTick(() => cm.value!.$el.focus());
    }
});

function close(): void {
    showAssetContextMenu.value = false;
}

async function rename(): Promise<void> {
    if (assetStore.state.selected.length !== 1) return;
    const asset = assetStore.state.idMap.get(assetStore.state.selected[0]!);
    if (asset === undefined) {
        console.error("Attempt to rename unknown file");
        return close();
    }

    const name = await modals.prompt(
        t("assetManager.AssetContextMenu.new_name"),
        t("assetManager.AssetContextMenu.renaming_NAME", { name: asset.name }),
    );
    if (name !== undefined) {
        assetStore.renameAsset(asset.id, name);
    }
    close();
}

async function remove(): Promise<void> {
    if (assetStore.state.selected.length === 0) return;
    const result = await modals.confirm(t("assetManager.AssetContextMenu.ask_remove"));
    if (result === true) {
        assetStore.removeSelection();
    }
    close();
}
</script>

<template>
    <ContextMenu
        ref="cm"
        :visible="showAssetContextMenu"
        :left="assetContextLeft"
        :top="assetContextTop"
        @cm:close="close"
    >
        <li @click="rename">{{ t("common.rename") }}</li>
        <li @click="remove">{{ t("common.remove") }}</li>
    </ContextMenu>
</template>
