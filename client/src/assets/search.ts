import debounce from "lodash/debounce";
import { ref, watch, type Ref } from "vue";

import type { ApiAssetEntry } from "../apiTypes";

import { socket } from "./socket";
import { assetState } from "./state";

interface AssetSearch {
    clear: () => void;
    filter: Ref<string>;
    results: Ref<ApiAssetEntry[]>;
    loading: Ref<boolean>;
    includeSharedAssets: Ref<boolean>;
}

export function useAssetSearch(searchBar: Ref<HTMLInputElement | null>): AssetSearch {
    const filter = ref("");
    const results = ref<ApiAssetEntry[]>([]);
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
        const data = (await socket.emitWithAck("Asset.Search", query, includeSharedAssets.value)) as ApiAssetEntry[];
        for (const asset of data) {
            assetState.mutableReactive.entryIdMap.set(asset.id, asset);
        }
        results.value = data;
        loading.value = false;
    }

    const debouncedSearch = debounce(search, 300);

    watch([filter, includeSharedAssets], async ([newFilter]) => {
        if (newFilter.length < 3) {
            results.value = [];
            return;
        }

        await debouncedSearch(newFilter);
    });

    return { clear, filter, results, loading, includeSharedAssets };
}
