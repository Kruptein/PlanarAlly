import { computed } from "vue";

import type { ApiAsset } from "../apiTypes";
import { buildState } from "../core/systems/state";

import type { AssetId } from "./models";

interface ReactiveAssetState {
    root: AssetId | undefined;
    files: AssetId[];
    folders: AssetId[];
    idMap: Map<AssetId, ApiAsset>;
    selected: AssetId[];
    // We track names here, as the full breadcrumb Asset info might not be known in idMap
    folderPath: { id: AssetId; name: string }[];

    loadingFolder: boolean;

    sharedParent: ApiAsset | null;
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
        idMap: new Map(),
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
