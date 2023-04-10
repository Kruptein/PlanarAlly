<script setup lang="ts">
import { computed } from "vue";

import type { ReadonlyAssetListMap } from "../../../../core/models/types";
import { filterAssetMap } from "../../../core/assets/utils";
import { gameState } from "../../../core/systems/game/state";

import AssetNode from "./AssetNode.vue";

const props = defineProps<{ search: string }>();

const assets = computed(() =>
    filterAssetMap(gameState.reactive.assets as ReadonlyAssetListMap, props.search.toLocaleLowerCase()),
);
</script>

<template>
    <AssetNode :assets="assets" :visible="true" />
</template>
