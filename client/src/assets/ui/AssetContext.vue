<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import { assetSystem } from "..";
import ContextMenu from "../../core/components/contextMenu/ContextMenu.vue";
import type { Section } from "../../core/components/contextMenu/types";
import { useModal } from "../../core/plugins/modals/plugin";
import { coreStore } from "../../store/core";
import type { AssetId } from "../models";
import { assetState } from "../state";

import AssetShare from "./AssetShare.vue";
import type { AssetContextMenu } from "./context";

const emit = defineEmits<{ (event: "rename", payload: AssetId): void; (event: "close"): void }>();
const props = defineProps<AssetContextMenu["state"] & { extraSections?: Section[] }>();

const cm = ref<{ $el: HTMLDivElement } | null>(null);
const modals = useModal();
const { t } = useI18n();

const showAssetShare = ref(false);

watch(props.visible, async () => {
    if (props.visible.value) {
        await nextTick(() => cm.value!.$el.focus());
    }
});

const multiSelect = computed(() => assetState.reactive.selected.length > 1);

const selectedAssetId = computed(() => assetState.reactive.selected.at(0));

const canShare = computed(() => {
    if (multiSelect.value) return false;
    if (selectedAssetId.value === undefined) return false;
    const data = assetState.reactive.idMap.get(selectedAssetId.value);
    if (data === undefined) return false;
    const username = coreStore.state.username;
    return data.owner === username || data.shares.some((s) => s.user === username && s.right === "edit");
});

function rename(): boolean {
    if (multiSelect.value) return true;
    const asset = assetState.raw.idMap.get(assetState.raw.selected[0]!);
    if (asset === undefined) {
        console.error("Attempt to rename unknown file");
        return true;
    }

    emit("rename", asset.id);

    return true;
}

function share(): boolean {
    showAssetShare.value = true;
    return true;
}

async function remove(): Promise<boolean> {
    if (assetState.raw.selected.length === 0) return false;
    const result = await modals.confirm(t("assetManager.AssetContextMenu.ask_remove"));
    if (result === true) {
        assetSystem.removeSelection();
    }
    return true;
}

const sections = computed<Section[]>(() => [
    ...(props.extraSections ?? []),
    {
        title: t("common.rename"),
        action: rename,
        disabled: multiSelect.value,
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
    <AssetShare :visible="showAssetShare" :asset="selectedAssetId" @close="showAssetShare = false" />
    <ContextMenu
        ref="cm"
        :left="left.value"
        :top="top.value"
        :visible="visible.value"
        :sections="sections"
        @cm:close="emit('close')"
    />
</template>
