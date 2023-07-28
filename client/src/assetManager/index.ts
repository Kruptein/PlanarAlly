import type { Asset } from "../core/models/types";
import { callbackProvider, uuidv4 } from "../core/utils";
import { router } from "../router";

import type { AssetId } from "./models";
import { socket } from "./socket";
import { assetState } from "./state";

const { raw, mutableReactive: $ } = assetState;

class AssetSystem {
    protected rootCallback = callbackProvider();

    clear(): void {
        $.folders = [];
        $.files = [];
    }

    clearFolderPath(): void {
        $.folderPath = [];
    }

    setRoot(root: AssetId): void {
        $.root = root;
        this.rootCallback.resolveAll();
    }

    setPath(path: AssetId[]): void {
        $.folderPath = path;
        let assetPath = router.currentRoute.value.path.slice("/assets/".length);
        if (assetPath.at(-1) === "/") assetPath = assetPath.slice(0, -1);
        if (assetPath.length === 0) return;

        for (const [index, part] of assetPath.split("/").entries()) {
            const pathId = path[index];
            if (pathId === undefined) {
                console.error("Incorrect PathIndex encountered.");
                continue;
            }
            $.idMap.set(pathId, { id: pathId, name: part });
        }
    }

    moveInode(inode: AssetId, targetFolder: AssetId): void {
        let targetData = $.folders;
        if (raw.files.includes(inode)) targetData = $.files;
        targetData.splice(targetData.indexOf(inode), 1);
        socket.emit("Inode.Move", { inode, target: targetFolder });
    }

    changeDirectory(targetFolder: AssetId | "POP"): void {
        if (targetFolder === "POP") {
            $.folderPath.pop();
        } else if (targetFolder === raw.root) {
            $.folderPath = [];
        } else if (raw.folderPath.includes(targetFolder)) {
            while (assetState.currentFolder.value !== targetFolder) $.folderPath.pop();
        } else {
            $.folderPath.push(targetFolder);
        }
        this.clearSelected();
        socket.emit("Folder.Get", assetState.currentFolder.value);
    }

    setFolderData(folder: AssetId, data: Asset): void {
        $.idMap.set(folder, data);
        if (data.children) {
            for (const child of data.children) {
                this.resolveUpload(child.name);
                this.addAsset(child);
            }
        }
    }

    // SELECTED

    addSelectedInode(inode: AssetId): void {
        $.selected.push(inode);
    }

    clearSelected(): void {
        $.selected = [];
    }

    removeSelection(): void {
        for (const sel of raw.selected) {
            socket.emit("Asset.Remove", sel);
            this.removeAsset(sel);
        }
        assetSystem.clearSelected();
    }

    // ASSET

    addAsset(asset: Asset, parent?: AssetId): void {
        if (parent !== undefined && parent !== assetState.currentFolder.value) return;

        $.idMap.set(asset.id, asset);
        let _target: "folders" | "files" = "folders";
        if (asset.file_hash !== null) {
            _target = "files";
        }
        const target = $[_target];
        target.push(asset.id);

        const sorted_target = target
            .map((i) => raw.idMap.get(i))
            .filter((a) => a !== undefined)
            .sort((a, b) => a!.name.localeCompare(b!.name))
            .map((a) => a!.id);

        $[_target] = sorted_target;
    }

    renameAsset(id: AssetId, name: string): void {
        socket.emit("Asset.Rename", {
            asset: id,
            name,
        });
        $.idMap.get(id)!.name = name;
    }

    removeAsset(asset: AssetId): void {
        let target = $.folders;
        if ($.files.includes(asset)) target = $.files;
        target.splice(target.indexOf(asset), 1);
        $.idMap.delete(asset);
    }

    // NETWORK

    resolveUpload(file: string): void {
        const idx = raw.pendingUploads.findIndex((f) => f === file);
        if (idx >= 0) {
            $.pendingUploads.splice(idx, 1);
            $.resolvedUploads++;
            if (raw.expectedUploads <= raw.resolvedUploads) {
                $.expectedUploads = 0;
                $.resolvedUploads = 0;
            }
        }
    }

    async upload(fls: FileList, options?: { target?: number | "root"; newDirectories?: string[] }): Promise<Asset[]> {
        let target = options?.target ?? assetState.currentFolder.value;
        const newDirectories = options?.newDirectories ?? [];

        // If the asset-socket isn't open at the moment
        // Open it, but make sure to close it again after we're done.
        const closeSocket = socket.disconnected;
        if (closeSocket) {
            socket.connect();
        }
        if (target === "root") {
            await this.rootCallback.wait();
            target = raw.root;
        }

        $.expectedUploads += fls.length;

        const uploadedFiles = [];

        const CHUNK_SIZE = 100000;
        for (const file of fls) {
            const uuid = uuidv4();
            const slices = Math.ceil(file.size / CHUNK_SIZE);
            $.pendingUploads.push(file.name);
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
export const assetSystem = new AssetSystem();
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
(window as any).assetSystem = assetSystem;
