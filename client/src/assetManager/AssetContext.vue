<script setup lang="ts">
import { computed, defineEmits, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import ContextMenu from "../core/components/contextMenu/ContextMenu.vue";
import type { Section } from "../core/components/contextMenu/types";
import { useModal } from "../core/plugins/modals/plugin";
import { coreStore } from "../store/core";

import AssetShare from "./AssetShare.vue";
import { assetContextLeft, assetContextTop, showAssetContextMenu } from "./context";
import type { AssetId } from "./models";
import { assetState } from "./state";

import { assetSystem } from ".";

const emit = defineEmits<{(event: "rename", payload: AssetId): void;}>();

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

function rename(): void {
    if (assetState.raw.selected.length !== 1) return;
    const asset = assetState.raw.idMap.get(assetState.raw.selected[0]!);
    if (asset === undefined) {
        console.error("Attempt to rename unknown file");
        return close();
    }

    emit("rename", asset.id);

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

const sections = computed<Section[]>(() => [
    {
        title: t("common.rename"),
        action: rename,
    },
    {
        title: "Share",
        action: share,
        disabled: !canShare.value,
    },
    {
        title: t("common.remove"),
        action: remove,
    },
]);
</script>

<template>
    <AssetShare :visible="showAssetShare" :asset="asset" @close="showAssetShare = false" />
    <ContextMenu
        ref="cm"
        :visible="showAssetContextMenu"
        :left="assetContextLeft"
        :top="assetContextTop"
        :sections="sections"
        @cm:close="close"
    />
</template>
