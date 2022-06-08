<script setup lang="ts">
import { computed } from "vue";

import type { ReadonlyAssetListMap } from "../../../core/models/types";
import { gameStore } from "../../../store/game";
import { filterAssetMap } from "../../assets/utils";

import AssetNode from "./AssetNode.vue";

const props = defineProps<{ search: string }>();

const assets = computed(() =>
    filterAssetMap(gameStore.state.assets as ReadonlyAssetListMap, props.search.toLocaleLowerCase()),
);
</script>

<template>
    <AssetNode :assets="assets" :visible="true" />
</template>
