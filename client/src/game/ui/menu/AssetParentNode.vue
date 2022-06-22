<script setup lang="ts">
import { computed } from "vue";

import type { ReadonlyAssetListMap } from "../../../core/models/types";
import { getGameState } from "../../../store/_game";
import { filterAssetMap } from "../../assets/utils";

import AssetNode from "./AssetNode.vue";

const props = defineProps<{ search: string }>();

const assets = computed(() =>
    filterAssetMap(getGameState().assets as ReadonlyAssetListMap, props.search.toLocaleLowerCase()),
);
</script>

<template>
    <AssetNode :assets="assets" :visible="true" />
</template>
