<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import ContextMenu from "../core/components/ContextMenu.vue";
import { useModal } from "../core/plugins/modals/plugin";
import { coreStore } from "../store/core";

import AssetShare from "./AssetShare.vue";
import { assetContextLeft, assetContextTop, showAssetContextMenu } from "./context";
import { assetState } from "./state";

import { assetSystem } from ".";

const cm = ref<{ $el: HTMLDivElement } | null>(null);
const modals = useModal();
const { t } = useI18n();

const showAssetShare = ref(false);

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

const asset = computed(() => assetState.reactive.selected.at(0));
const canShare = computed(() => {
    if (assetState.reactive.selected.length !== 1) return false;
    if (asset.value === undefined) return false;
    const data = assetState.reactive.idMap.get(asset.value);
    if (data === undefined) return false;
    const username = coreStore.state.username;
    console.log(data.shares);
    return data.owner === username || data.shares.some((s) => s.user === username && s.right === "edit");
});

function close(): void {
    showAssetContextMenu.value = false;
}

async function rename(): Promise<void> {
    if (assetState.raw.selected.length !== 1) return;
    const asset = assetState.raw.idMap.get(assetState.raw.selected[0]!);
    if (asset === undefined) {
        console.error("Attempt to rename unknown file");
        return close();
    }

    const name = await modals.prompt(
        t("assetManager.AssetContextMenu.new_name"),
        t("assetManager.AssetContextMenu.renaming_NAME", { name: asset.name }),
        undefined,
        asset.name,
    );
    if (name !== undefined) {
        assetSystem.renameAsset(asset.id, name);
    }
    close();
}

function share(): void {
    showAssetShare.value = true;
    close();
}

async function remove(): Promise<void> {
    if (assetState.raw.selected.length === 0) return;
    const result = await modals.confirm(t("assetManager.AssetContextMenu.ask_remove"));
    if (result === true) {
        assetSystem.removeSelection();
    }
    close();
}
</script>

<template>
    <AssetShare :visible="showAssetShare" :asset="asset" @close="showAssetShare = false" />
    <ContextMenu
        ref="cm"
        :visible="showAssetContextMenu"
        :left="assetContextLeft"
        :top="assetContextTop"
        @cm:close="close"
    >
        <li @click="rename">{{ t("common.rename") }}</li>
        <li v-show="canShare" @click="share">Share</li>
        <li @click="remove">{{ t("common.remove") }}</li>
    </ContextMenu>
</template>
