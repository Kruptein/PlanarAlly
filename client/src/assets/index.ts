import { useToast } from "vue-toastification";

import type { ApiAsset, ApiAssetUpload } from "../apiTypes";
import { registerSystem, type System } from "../core/systems";
import type { SystemClearReason } from "../core/systems/models";
import { callbackProvider, uuidv4 } from "../core/utils";
import { router } from "../router";

import { sendAssetRemove, sendAssetRename, getFolder, sendInodeMove, getFolderPath, getFolderByPath } from "./emits";
import type { AssetId } from "./models";
import { socket } from "./socket";
import { assetState } from "./state";

import "./events";

const toast = useToast();

const { raw, mutableReactive: $ } = assetState;

class AssetSystem implements System {
    rootCallback = callbackProvider();

    clearLocal(): void {
        $.folders = [];
        $.files = [];
        $.loadingFolder = false;
    }

    clear(reason: SystemClearReason): void {
        if (reason === "logging-out") {
            this.clearLocal();
            $.idMap.clear();
            $.folderPath = [];
        }
    }

    clearFolderPath(): void {
        $.folderPath = [];
    }

    setRoot(root: AssetId): void {
        $.root = root;
        this.rootCallback.resolveAll();
    }

    setPath(path: AssetId[]): void {
        $.folderPath = [];
        let assetPath = router.currentRoute.value.path.slice("/assets/".length);
        if (assetPath.at(-1) === "/") assetPath = assetPath.slice(0, -1);
        if (assetPath.length === 0) return;

        for (const [index, part] of assetPath.split("/").entries()) {
            const pathId = path[index];
            if (pathId === undefined) {
                console.error("Incorrect PathIndex encountered.");
                continue;
            }
            $.folderPath.push({ id: pathId, name: part });
        }
    }

    moveInode(inode: AssetId, targetFolder: AssetId): void {
        let targetData = $.folders;
        if (raw.files.includes(inode)) targetData = $.files;
        targetData.splice(targetData.indexOf(inode), 1);
        sendInodeMove({ inode, target: targetFolder });
    }

    async changeDirectory(targetFolder: AssetId | "POP"): Promise<void> {
        $.loadingFolder = true;
        if (targetFolder === "POP") {
            $.folderPath.pop();
        } else if (targetFolder === raw.root) {
            $.folderPath = [];
        } else if (raw.folderPath.some((fp) => fp.id === targetFolder)) {
            while (assetState.currentFolder.value !== targetFolder) $.folderPath.pop();
        } else {
            const asset = raw.idMap.get(targetFolder);
            if (asset !== undefined) {
                if (raw.root && ($.idMap.get(raw.root)?.children?.some((c) => c.id === targetFolder) ?? false)) {
                    $.folderPath = [{ id: targetFolder, name: asset.name }];
                } else {
                    const path = await getFolderPath(targetFolder);
                    $.folderPath = path.slice(1);
                }
            }
        }
        this.clearSelected();
        await this.loadFolder(assetState.currentFolder.value);
    }

    async loadFolder(folder: AssetId | string | undefined): Promise<void> {
        if (folder === undefined) return;

        const data = typeof folder === "string" ? await getFolderByPath(folder) : await getFolder(folder);
        this.clearLocal();
        this.setFolderData(data.folder.id, data.folder);
        if (data.path) assetSystem.setPath(data.path);
        assetState.mutableReactive.sharedParent = data.sharedParent;
        assetState.mutableReactive.sharedRight = data.sharedRight;
    }

    setFolderData(folder: AssetId, data: ApiAsset): void {
        $.idMap.set(folder, data);
        if (data.children) {
            for (const child of data.children) {
                this.resolveUpload(child.name);
                this.addAsset(child);
            }
        }
        $.loadingFolder = false;
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
            // todo: change this to a single event containing all assetIds
            sendAssetRemove(sel);
            this.removeAsset(sel);
        }
        assetSystem.clearSelected();
    }

    // ASSET

    addAsset(asset: ApiAsset, parent?: AssetId): void {
        if (parent !== undefined && parent !== assetState.currentFolder.value) return;

        $.idMap.set(asset.id, asset);
        let _target: "folders" | "files" = "folders";
        if (asset.fileHash !== null) {
            _target = "files";
        }
        const target = $[_target];
        target.push(asset.id);

        const sorted_target = target
            .map((i) => raw.idMap.get(i))
            .filter((a) => a !== undefined)
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((a) => a.id);

        $[_target] = sorted_target;
    }

    renameAsset(id: AssetId, name: string): void {
        sendAssetRename({
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

    async upload(
        fls: FileList,
        // target is a function, because if the socket is closed, none of the usual targets exist yet
        options?: { target?: () => AssetId | undefined; newDirectories?: string[] },
    ): Promise<ApiAsset[]> {
        const closeSocket = socket.disconnected;
        if (closeSocket) {
            socket.connect();
            await assetSystem.rootCallback.wait();
        }

        const limit = (await socket.emitWithAck("Asset.Upload.Limit")) as {
            single: number;
            total: number;
            used: number;
        };

        // First check limits
        let totalSize = 0;
        for (const file of fls) {
            totalSize += file.size;
            if (limit.single > 0 && file.size > limit.single) {
                toast.error(
                    `File ${file.name} is too large. Max size is ${limit.single} bytes. Contact the server admin if you need to upload larger files.`,
                    { timeout: 0 },
                );
                return [];
            }
            if (limit.total > 0 && totalSize > limit.total - limit.used) {
                const remaining = Math.max(0, limit.total - limit.used);
                toast.error(
                    `Total size of files is too large. You have ${remaining} bytes remaining and attempted to upload ${totalSize} bytes. Contact the server admin if you need to upload larger files.`,
                    { timeout: 0 },
                );
                return [];
            }
        }

        const target = options?.target?.() ?? assetState.currentFolder.value;
        if (target === undefined) throw new Error("Upload target was not found. CurrentFolder is undefined?");

        const newDirectories = options?.newDirectories ?? [];

        $.expectedUploads += fls.length;

        const uploadedFiles = [];

        const CHUNK_SIZE = 100000;
        for (const file of fls) {
            const uuid = uuidv4();
            const slices = Math.ceil(file.size / CHUNK_SIZE);
            $.pendingUploads.push(file.name);
            for (let slice = 0; slice < slices; slice++) {
                const uploadedFile = await new Promise<ApiAsset | undefined>((resolve) => {
                    const fr = new FileReader();
                    fr.readAsArrayBuffer(
                        file.slice(
                            slice * CHUNK_SIZE,
                            slice * CHUNK_SIZE + Math.min(CHUNK_SIZE, file.size - slice * CHUNK_SIZE),
                        ),
                    );
                    fr.onload = (_e) => {
                        if (fr.result === null) return;

                        const uploadData: ApiAssetUpload = {
                            name: file.name,
                            directory: target,
                            newDirectories,
                            // todo: At server this is typed as `bytes`
                            // but openapi makes it `string`
                            // in reality it's an ArrayBuffer, but that's fine for the bytes type
                            data: fr.result as string,
                            slice,
                            totalSlices: slices,
                            uuid,
                        };
                        socket.emit("Asset.Upload", uploadData, resolve);
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

    // SHARES

    addShare(asset: AssetId, user: string, right: "view" | "edit"): void {
        const data = $.idMap.get(asset);
        if (data === undefined) return console.error("Unknown asset was provided");
        data.shares.push({ user, right });
    }
}
export const assetSystem = new AssetSystem();
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
(window as any).assetSystem = assetSystem;
registerSystem("asset", assetSystem, false, assetState);
