import { ref, watch, type Ref } from "vue";

import type { ApiAsset } from "../apiTypes";

import { socket } from "./socket";
import { assetState } from "./state";

interface AssetSearch {
    clear: () => void;
    filter: Ref<string>;
    results: Ref<ApiAsset[]>;
    loading: Ref<boolean>;
}

export function useAssetSearch(searchBar: Ref<HTMLInputElement | null>): AssetSearch {
    const filter = ref("");
    const results = ref<ApiAsset[]>([]);
    const loading = ref(false);
    watch(assetState.currentFolder, () => {
        filter.value = "";
    });

    function clear(): void {
        filter.value = "";
        searchBar.value?.focus();
    }

    watch(filter, async (filter) => {
        if (filter.length < 3) {
            results.value = [];
            return;
        }

        loading.value = true;
        const data = (await socket.emitWithAck("Asset.Search", filter)) as ApiAsset[];
        for (const asset of data) {
            assetState.mutableReactive.idMap.set(asset.id, asset);
        }
        results.value = data;
        loading.value = false;
    });

    return { clear, filter, results, loading };
}
