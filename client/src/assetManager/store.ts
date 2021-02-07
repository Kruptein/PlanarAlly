// import Vuex from "vuex";
import { getModule, Module, Mutation, VuexModule } from "vuex-module-decorators";

import { Asset } from "@/core/comm/types";
import { rootStore } from "@/store";

import { router } from "../router";

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
    _files: number[] = [];
    _folders: number[] = [];
    _idMap: Map<number, Asset> = new Map();
    _selected: number[] = [];
    folderPath: number[] = [];

    _pendingUploads: string[] = [];
    _resolvedUploads = 0;
    private _expectedUploads = 0;

    @Mutation
    clear(): void {
        this._folders = [];
        this._files = [];
    }

    @Mutation
    clearSelected(): void {
        this._selected = [];
    }

    @Mutation
    clearFolderPath(): void {
        this.folderPath = [];
    }

    @Mutation
    addExpectedUploads(number: number): void {
        this._expectedUploads += number;
    }

    @Mutation
    setRoot(root: number): void {
        this.root = root;
    }

    @Mutation
    setPath(path: number[]): void {
        this.folderPath = path;
        for (const [index, part] of router.currentRoute.path.slice("/assets/".length).split("/").entries()) {
            this._idMap.set(path[index], { id: path[index], name: part });
        }
    }

    @Mutation
    resolveUpload(file: string): void {
        const idx = this._pendingUploads.findIndex((f) => f === file);
        if (idx >= 0) {
            this._pendingUploads.splice(idx, 1);
            this._resolvedUploads++;
            if (this._expectedUploads <= this._resolvedUploads) {
                this._expectedUploads = 0;
                this._resolvedUploads = 0;
            }
        }
    }

    @Mutation
    addAsset(asset: Asset): void {
        this._idMap.set(asset.id, asset);
        let target = this._folders;
        if (asset.file_hash) {
            target = this._files;
        }
        target.push(asset.id);

        const sorted_target = target
            .map((i) => this._idMap.get(i))
            .filter((a) => a !== undefined)
            .sort((a, b) => a!.name.localeCompare(b!.name))
            .map((a) => a!.id);
        if (asset.file_hash) {
            this._files = sorted_target;
        } else {
            this._folders = sorted_target;
        }
    }

    @Mutation
    removeAsset(asset: number): void {
        let target = this._folders;
        if (this._files.includes(asset)) target = this._files;
        target.splice(target.indexOf(asset), 1);
        this._idMap.delete(asset);
    }

    get path(): number[] {
        return this.folderPath;
    }

    get expectedUploads(): number {
        return this._expectedUploads;
    }

    get files(): readonly number[] {
        return this._files;
    }

    get folders(): readonly number[] {
        return this._folders;
    }

    get idMap(): Map<number, Asset> {
        return this._idMap;
    }

    get pendingUploads(): string[] {
        return this._pendingUploads;
    }

    get resolvedUploads(): number {
        return this._resolvedUploads;
    }

    get selected(): number[] {
        return this._selected;
    }

    get currentFilePath(): string {
        return this.folderPath.reduce((acc: string, val: number) => `${acc}/${this.idMap.get(val)?.name}`, "");
    }

    get currentFolder(): number {
        if (this.path.length) return this.path[this.path.length - 1];
        return this.root;
    }
    get parentFolder(): number {
        let parent = this.path[this.path.length - 2];
        if (parent === undefined) parent = this.root;
        return parent;
    }
    get firstSelectedFile(): Asset | null {
        for (const sel of this.selected) {
            if (this.idMap.get(sel)!.file_hash) {
                return this.idMap.get(sel)!;
            }
        }
        return null;
    }
}

export const assetStore = getModule(AssetStore);
