import { computed } from "vue";

import type { ApiAssetCore, ApiAssetEntry } from "../apiTypes";
import { buildState } from "../core/systems/state";

import type { AssetEntryId, AssetId } from "./models";

interface ReactiveAssetState {
    root: AssetEntryId | undefined;
    files: AssetEntryId[];
    folders: AssetEntryId[];
    entryIdMap: Map<AssetEntryId, ApiAssetEntry>;
    assetIdMap: Map<AssetId, ApiAssetCore>;
    selected: AssetEntryId[];
    // We track names here, as the full breadcrumb Asset info might not be known in idMap
    folderPath: { id: AssetEntryId; name: string }[];

    loadingFolder: boolean;

    sharedParent: ApiAssetEntry | null;
    sharedRight: "edit" | "view" | null;

    pendingUploads: string[];
    expectedUploads: number;
    resolvedUploads: number;
}

interface NonReactiveAssetState {
    modalActive: boolean;
}

const state = buildState<ReactiveAssetState, NonReactiveAssetState>(
    {
        root: undefined,
        files: [],
        folders: [],
        entryIdMap: new Map(),
        assetIdMap: new Map(),
        selected: [],
        folderPath: [],

        loadingFolder: false,

        sharedParent: null,
        sharedRight: null,

        pendingUploads: [],
        expectedUploads: 0,
        resolvedUploads: 0,
    },
    { modalActive: false },
);

export const assetState = {
    ...state,
    currentFolder: computed(() => {
        return state.reactive.folderPath.at(-1)?.id ?? state.reactive.root;
    }),
    parentFolder: computed(() => {
        return state.reactive.folderPath.at(-2)?.id ?? state.reactive.root;
    }),
    currentFilePath: computed(() =>
        state.reactive.folderPath.reduce((acc: string, val: { name: string }) => `${acc}/${val.name}`, ""),
    ),
};
