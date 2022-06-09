import { baseAdjust } from "../core/http";
import type { Asset } from "../core/models/types";
import { socketManager } from "../core/socket";
import { router } from "../router";

import { assetStore } from "./state";

export const socket = socketManager.socket("/pa_assetmgmt");

let disConnected = false;

socket.on("connect", () => {
    console.log("Connected");
    if (disConnected) socket.emit("Folder.Get", assetStore.currentFolder.value);
});
socket.on("disconnect", () => {
    console.log("Disconnected");
    disConnected = true;
});
socket.on("redirect", (destination: string) => {
    console.log("redirecting");
    window.location.href = destination;
});
socket.on("Folder.Root.Set", (root: number) => {
    assetStore.setRoot(root);
});
socket.on("Folder.Set", async (data: { folder: Asset; path?: number[] }) => {
    assetStore.clear();
    assetStore.setFolderData(data.folder.id, data.folder);
    if (!assetStore.state.modalActive) {
        if (data.path) assetStore.setPath(data.path);
        const path = baseAdjust(`/assets${assetStore.currentFilePath.value}`);
        if (path !== router.currentRoute.value.path) {
            await router.push({ path });
        }
    }
});
socket.on("Folder.Create", (data: { asset: Asset; parent: number }) => {
    assetStore.addAsset(data.asset, data.parent);
});
socket.on("Asset.Upload.Finish", (data: { asset: Asset; parent: number }) => {
    assetStore.addAsset(data.asset, data.parent);
    assetStore.resolveUpload(data.asset.name);
});

socket.on("Asset.Export.Finish", (uuid: string) => {
    window.open(baseAdjust(`/static/temp/${uuid}.paa`));
});

socket.on("Asset.Import.Finish", (name: string) => {
    assetStore.resolveUpload(name);
    socket.emit("Folder.Get", assetStore.currentFolder.value);
});
