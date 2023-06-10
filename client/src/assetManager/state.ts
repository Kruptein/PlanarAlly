import type { ComputedRef } from "vue";
import { computed } from "vue";

import type { Asset } from "../core/models/types";
import { Store } from "../core/store";
import { callbackProvider, uuidv4 } from "../core/utils";
import { router } from "../router";

import { socket } from "./socket";

interface AssetState {
    modalActive: boolean;

    root: number;
    files: number[];
    folders: number[];
    idMap: Map<number, Asset>;
    selected: number[];

    folderPath: number[];

    pendingUploads: string[];
    expectedUploads: number;
    resolvedUploads: number;
}

class AssetStore extends Store<AssetState> {
    currentFolder: ComputedRef<number>;
    parentFolder: ComputedRef<number>;
    currentFilePath: ComputedRef<string>;

    protected rootCallback = callbackProvider();

    constructor() {
        super();
        this.currentFolder = computed(() => {
            return this._state.folderPath.at(-1) ?? this._state.root;
        });

        this.parentFolder = computed(() => {
            return this._state.folderPath.at(-2) ?? this._state.root;
        });

        this.currentFilePath = computed(() =>
            this._state.folderPath.reduce(
                (acc: string, val: number) => `${acc}/${this._state.idMap.get(val)!.name}`,
                "",
            ),
        );
    }

    protected data(): AssetState {
        return {
            modalActive: false,

            root: -1,
            files: [],
            folders: [],
            idMap: new Map(),
            selected: [],

            folderPath: [],

            pendingUploads: [],
            expectedUploads: 0,
            resolvedUploads: 0,
        };
    }

    clear(): void {
        this._state.folders = [];
        this._state.files = [];
    }

    clearFolderPath(): void {
        this._state.folderPath = [];
    }

    setRoot(root: number): void {
        this._state.root = root;
        this.rootCallback.resolveAll();
    }

    setPath(path: number[]): void {
        this._state.folderPath = path;
        let assetPath = router.currentRoute.value.path.slice("/assets/".length);
        if (assetPath.at(-1) === "/") assetPath = assetPath.slice(0, -1);
        if (assetPath.length === 0) return;

        for (const [index, part] of assetPath.split("/").entries()) {
            const pathId = path[index];
            if (pathId === undefined) {
                console.error("Incorrect PathIndex encountered.");
                continue;
            }
            this._state.idMap.set(pathId, { id: pathId, name: part });
        }
    }

    setModalActive(active: boolean): void {
        this._state.modalActive = active;
    }

    moveInode(inode: number, targetFolder: number): void {
        let targetData = this._state.folders;
        if (this._state.files.includes(inode)) targetData = this._state.files;
        targetData.splice(targetData.indexOf(inode), 1);
        socket.emit("Inode.Move", { inode, target: targetFolder });
    }

    changeDirectory(targetFolder: number): void {
        if (targetFolder < 0) {
            this._state.folderPath.pop();
        } else if (targetFolder === this._state.root) {
            this._state.folderPath = [];
        } else if (this._state.folderPath.includes(targetFolder)) {
            while (this.currentFolder.value !== targetFolder) this._state.folderPath.pop();
        } else {
            this._state.folderPath.push(targetFolder);
        }
        this.clearSelected();
        socket.emit("Folder.Get", this.currentFolder.value);
    }

    setFolderData(folder: number, data: Asset): void {
        this._state.idMap.set(folder, data);
        if (data.children) {
            for (const child of data.children) {
                this.resolveUpload(child.name);
                this.addAsset(child);
            }
        }
    }

    // SELECTED

    addSelectedInode(inode: number): void {
        this._state.selected.push(inode);
    }

    clearSelected(): void {
        this._state.selected = [];
    }

    removeSelection(): void {
        for (const sel of assetStore.state.selected) {
            socket.emit("Asset.Remove", sel);
            this.removeAsset(sel);
        }
        assetStore.clearSelected();
    }

    // ASSET

    addAsset(asset: Asset, parent?: number): void {
        if (parent !== undefined && parent !== this.currentFolder.value) return;

        this._state.idMap.set(asset.id, asset);
        let target: "folders" | "files" = "folders";
        if (asset.file_hash !== null) {
            target = "files";
        }
        this._state[target].push(asset.id);

        const sorted_target = this._state[target]
            .map((i) => this._state.idMap.get(i))
            .filter((a) => a !== undefined)
            .sort((a, b) => a!.name.localeCompare(b!.name))
            .map((a) => a!.id);

        this._state[target] = sorted_target;
    }

    renameAsset(id: number, name: string): void {
        socket.emit("Asset.Rename", {
            asset: id,
            name,
        });
        this._state.idMap.get(id)!.name = name;
    }

    removeAsset(asset: number): void {
        let target = this._state.folders;
        if (this._state.files.includes(asset)) target = this._state.files;
        target.splice(target.indexOf(asset), 1);
        this._state.idMap.delete(asset);
    }

    // NETWORK

    resolveUpload(file: string): void {
        const idx = this._state.pendingUploads.findIndex((f) => f === file);
        if (idx >= 0) {
            this._state.pendingUploads.splice(idx, 1);
            this._state.resolvedUploads++;
            if (this._state.expectedUploads <= this._state.resolvedUploads) {
                this._state.expectedUploads = 0;
                this._state.resolvedUploads = 0;
            }
        }
    }

    async upload(fls: FileList, options?: { target?: number | "root"; newDirectories?: string[] }): Promise<Asset[]> {
        let target = options?.target ?? this.currentFolder.value;
        const newDirectories = options?.newDirectories ?? [];

        // If the asset-socket isn't open at the moment
        // Open it, but make sure to close it again after we're done.
        const closeSocket = socket.disconnected;
        if (closeSocket) {
            socket.connect();
        }
        if (target === "root") {
            await this.rootCallback.wait();
            target = this._state.root;
        }

        this._state.expectedUploads += fls.length;

        const uploadedFiles = [];

        const CHUNK_SIZE = 100000;
        for (const file of fls) {
            const uuid = uuidv4();
            const slices = Math.ceil(file.size / CHUNK_SIZE);
            this._state.pendingUploads.push(file.name);
            for (let slice = 0; slice < slices; slice++) {
                const uploadedFile = await new Promise<Asset | undefined>((resolve) => {
                    const fr = new FileReader();
                    fr.readAsArrayBuffer(
                        file.slice(
                            slice * CHUNK_SIZE,
                            slice * CHUNK_SIZE + Math.min(CHUNK_SIZE, file.size - slice * CHUNK_SIZE),
                        ),
                    );
                    fr.onload = (_e) => {
                        socket.emit(
                            "Asset.Upload",
                            {
                                name: file.name,
                                directory: target,
                                newDirectories,
                                data: fr.result,
                                slice,
                                totalSlices: slices,
                                uuid,
                            },
                            resolve,
                        );
                    };
                });
                // The returned data is undefined, if the file has multiple slices
                // only the last slice will return a valid file
                if (uploadedFile !== undefined) uploadedFiles.push(uploadedFile);
            }
        }
        if (closeSocket) socket.disconnect();

        return uploadedFiles;
    }
}
export const assetStore = new AssetStore();
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
(window as any).assetStore = assetStore;
