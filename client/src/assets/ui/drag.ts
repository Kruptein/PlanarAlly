import type { Ref } from "vue";
import { onMounted, ref } from "vue";
import { useToast } from "vue-toastification";

import { assetSystem } from "..";
import { map } from "../../core/iter";
import { DropAssetInfo } from "../../game/dropAsset";
import type { AssetEntryId } from "../models";
import { assetState } from "../state";

import { canEdit } from "./access";

const toast = useToast();

let emit: (event: "onDragEnd" | "onDragLeave" | "onDragStart", value: DragEvent) => void = () => {};
let draggingSelection = false;
const dropZoneVisible = ref(0);

function showDropZone(): void {
    dropZoneVisible.value++;
}

function hideDropZone(): void {
    dropZoneVisible.value--;
}

function fsToFile(fl: FileSystemFileEntry): Promise<File> {
    return new Promise((resolve) => fl.file(resolve));
}

async function parseDirectoryUpload(
    fileSystemEntries: Iterable<FileSystemEntry | null>,
    target: AssetEntryId,
    newDirectories: string[] = [],
): Promise<void> {
    const files: FileSystemFileEntry[] = [];
    for (const entry of fileSystemEntries) {
        if (entry === null) continue;
        if (entry.isDirectory) {
            const fwk = entry as FileSystemDirectoryEntry;
            const reader = fwk.createReader();
            reader.readEntries(
                (entries) => void parseDirectoryUpload(entries, target, [...newDirectories, entry.name]),
            );
        } else if (entry.isFile) {
            files.push(entry as FileSystemFileEntry);
        }
    }
    if (files.length > 0) {
        const fileList = await Promise.all(files.map((f) => fsToFile(f)));
        await assetSystem.upload(fileList as unknown as FileList, {
            target: () => target,
            newDirectories,
        });
    }
}

async function onDrop(event: DragEvent): Promise<void> {
    emit("onDragEnd", event);
    hideDropZone();
    const currentFolder = assetState.currentFolder.value;
    if (!canEdit(currentFolder)) {
        toast.error("You do not have permission to do this.");
        return;
    }

    if (currentFolder && event.dataTransfer && event.dataTransfer.items.length > 0) {
        await parseDirectoryUpload(
            map(event.dataTransfer.items, (i) => i.webkitGetAsEntry()),
            currentFolder,
        );
    }
}

function startDrag(event: DragEvent, file: AssetEntryId): void {
    if (event.dataTransfer === null) return;
    // Note: Start drag does NOT require an edit check, as it might be used to drag a file to the canvas
    // The drop handlers will check if edit access is required

    // Find the image to use as the drag image
    const image = (event.target as HTMLElement).closest(".inode")?.querySelector("img");
    if (image) {
        event.dataTransfer.setDragImage(image, 0, 0);
    }

    const assetInfo = assetState.raw.idMap.get(file);

    if (assetInfo?.assetId !== undefined) {
        // Add file info in case we drop it on the canvas
        event.dataTransfer.setData(
            "text/plain",
            JSON.stringify({
                assetHash: assetInfo.fileHash,
                entryId: file,
                assetId: assetInfo.assetId,
            } as DropAssetInfo),
        );
    }
    event.dataTransfer.dropEffect = "move";

    if (!assetState.raw.selected.includes(file)) assetSystem.addSelectedInode(file);
    draggingSelection = true;

    emit("onDragStart", event);
}

function moveDrag(event: DragEvent): void {
    const fromElement = (event.target as HTMLElement).closest(".inode");

    if (fromElement) {
        fromElement.classList.add("inode-hovered");
    }
}

function leaveDrag(event: DragEvent): void {
    const fromElement = (event.target as HTMLElement).closest(".inode");
    const toElement = event.relatedTarget as HTMLElement;

    if (fromElement && fromElement !== toElement.closest(".inode")) {
        fromElement.classList.remove("inode-hovered");
    }
}

function onDragEnd(event: DragEvent): void {
    emit("onDragEnd", event);
    hideDropZone();

    const fromElement = (event.target as HTMLElement).closest(".inode");
    if (fromElement) {
        fromElement.classList.remove("inode-hovered");
    }
}

async function stopDrag(event: DragEvent, target: AssetEntryId): Promise<void> {
    emit("onDragEnd", event);
    (event.target as HTMLElement).classList.remove("inode-hovered");

    if (!canEdit(target)) {
        if (!assetState.raw.selected.includes(target)) toast.error("You do not have permission to do this.");
    } else {
        if (draggingSelection) {
            if (assetState.raw.selected.includes(target)) return;
            if (
                target === assetState.parentFolder.value ||
                target === assetState.raw.root ||
                assetState.raw.folders.includes(target)
            ) {
                for (const inode of assetState.raw.selected) {
                    assetSystem.moveInode(inode, target);
                }
            }
            assetSystem.clearSelected();
        } else if (event.dataTransfer && event.dataTransfer.items.length > 0) {
            await parseDirectoryUpload(
                map(event.dataTransfer.items, (i) => i.webkitGetAsEntry()),
                target,
            );
        }
    }
    draggingSelection = false;
    dropZoneVisible.value = 0;
}

interface DragComposable {
    dropZoneVisible: Ref<number>;
    startDrag: (event: DragEvent, file: AssetEntryId) => void;
    moveDrag: (event: DragEvent) => void;
    leaveDrag: (event: DragEvent) => void;
    onDragEnd: (event: DragEvent) => void;
    onDrop: (event: DragEvent) => Promise<void>;
    stopDrag: (event: DragEvent, target: AssetEntryId) => Promise<void>;
}

export function useDrag(
    _emit: (event: "onDragEnd" | "onDragLeave" | "onDragStart", value: DragEvent) => void,
): DragComposable {
    emit = _emit;
    onMounted(() => {
        const body = document.getElementsByTagName("body")[0];
        body?.addEventListener("dragenter", showDropZone);
        body?.addEventListener("dragleave", hideDropZone);
    });

    return {
        dropZoneVisible,
        startDrag,
        moveDrag,
        leaveDrag,
        onDragEnd,
        onDrop,
        stopDrag,
    };
}
