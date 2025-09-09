import debounce from "lodash/debounce";
import { ref, watch, type Ref } from "vue";

import type { ApiAsset } from "../apiTypes";

import { socket } from "./socket";
import { assetState } from "./state";

interface AssetSearch {
    clear: () => void;
    filter: Ref<string>;
    results: Ref<ApiAsset[]>;
    loading: Ref<boolean>;
    includeSharedAssets: Ref<boolean>;
}

export function useAssetSearch(searchBar: Ref<HTMLInputElement | null>): AssetSearch {
    const filter = ref("");
    const results = ref<ApiAsset[]>([]);
    const loading = ref(false);
    const includeSharedAssets = ref(false);

    watch(assetState.currentFolder, () => {
        filter.value = "";
    });

    function clear(): void {
        filter.value = "";
        searchBar.value?.focus();
    }

    async function search(query: string): Promise<void> {
        loading.value = true;
        const data = (await socket.emitWithAck("Asset.Search", query, includeSharedAssets.value)) as ApiAsset[];
        for (const asset of data) {
            assetState.mutableReactive.idMap.set(asset.id, asset);
        }
        results.value = data;
        loading.value = false;
    }

    const debouncedSearch = debounce(search, 300);

    watch([filter, includeSharedAssets], async ([filter]) => {
        if (filter.length < 3) {
            results.value = [];
            return;
        }

        await debouncedSearch(filter);
    });

    return { clear, filter, results, loading, includeSharedAssets };
}
