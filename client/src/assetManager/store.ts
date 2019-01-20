// import Vuex from "vuex";
import { getModule, Module, Mutation, VuexModule } from "vuex-module-decorators";

import { Asset } from "@/core/comm/types";
import { rootStore } from "@/store";

export interface AssetState {
    root: number;
    files: number[];
    folders: number[];
    idMap: Map<number, Asset>;
    selected: number[];
}

@Module({ dynamic: true, store: rootStore, name: "assets", namespaced: true })
class AssetStore extends VuexModule {
    root = -1;
    files: number[] = [];
    folders: number[] = [];
    idMap: Map<number, Asset> = new Map();
    selected: number[] = [];

    @Mutation
    clear() {
        this.folders = [];
        this.files = [];
    }

    @Mutation
    clearSelected() {
        console.log("Cleared");
        this.selected = [];
    }

    @Mutation
    setRoot(root: number) {
        this.root = root;
    }
}

export const assetStore = getModule(AssetStore);
