<script lang="ts">
import { computed, defineComponent } from "vue";

import type { ReadonlyAssetListMap } from "../../../core/models/types";
import { gameStore } from "../../../store/game";
import { filterAssetMap } from "../../assets/utils";

import AssetNode from "./AssetNode.vue";

export default defineComponent({
    name: "AssetParentNode",
    components: { AssetNode },
    props: {
        search: { type: String, required: true },
    },
    setup(props) {
        const assets = computed(() =>
            filterAssetMap(gameStore.state.assets as ReadonlyAssetListMap, props.search.toLocaleLowerCase()),
        );

        return { assets };
    },
});
</script>

<template>
    <AssetNode :assets="assets" />
</template>
