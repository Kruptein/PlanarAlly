import { computed } from "vue";

import type { ApiAsset } from "../apiTypes";
import { buildState } from "../game/systems/state";

import type { AssetId } from "./models";

interface ReactiveAssetState {
    root: AssetId | undefined;
    files: AssetId[];
    folders: AssetId[];
    idMap: Map<AssetId, ApiAsset>;
    selected: AssetId[];
    folderPath: AssetId[];

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

        pendingUploads: [],
        expectedUploads: 0,
        resolvedUploads: 0,
    },
    { modalActive: false },
);

export const assetState = {
    ...state,
    currentFolder: computed(() => {
        return state.reactive.folderPath.at(-1) ?? state.reactive.root;
    }),
    parentFolder: computed(() => {
        return state.reactive.folderPath.at(-2) ?? state.reactive.root;
    }),
    currentFilePath: computed(() =>
        state.reactive.folderPath.reduce(
            (acc: string, val: AssetId) => `${acc}/${state.reactive.idMap.get(val)!.name}`,
            "",
        ),
    ),
};
