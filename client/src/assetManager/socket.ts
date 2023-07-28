import type { ApiAsset } from "../apiTypes";
import { baseAdjust } from "../core/http";
import { socketManager } from "../core/socket";
import { router } from "../router";

import type { AssetId } from "./models";
import { assetState } from "./state";

import { assetSystem } from ".";

export const socket = socketManager.socket("/pa_assetmgmt");

let disConnected = false;

socket.on("connect", () => {
    console.log("[Assets] connected");
    if (disConnected) socket.emit("Folder.Get", assetState.currentFolder.value);
});

socket.on("disconnect", () => {
    console.log("[Assets] disconnected");
    disConnected = true;
});

socket.on("redirect", (destination: string) => {
    console.log("redirecting");
    window.location.href = destination;
});

socket.on("Folder.Root.Set", (root: AssetId) => {
    assetSystem.setRoot(root);
});

socket.on("Folder.Set", async (data: { folder: ApiAsset; path?: AssetId[] }) => {
    assetSystem.clear();
    assetSystem.setFolderData(data.folder.id, data.folder);
    if (!assetState.readonly.modalActive) {
        if (data.path) assetSystem.setPath(data.path);
        const path = `/assets${assetState.currentFilePath.value}/`;
        if (path !== router.currentRoute.value.path) {
            await router.push({ path });
        }
    }
});

socket.on("Folder.Create", (data: { asset: ApiAsset; parent: AssetId }) => {
    assetSystem.addAsset(data.asset, data.parent);
});

socket.on("Asset.Upload.Finish", (data: { asset: ApiAsset; parent: AssetId }) => {
    assetSystem.addAsset(data.asset, data.parent);
    assetSystem.resolveUpload(data.asset.name);
});

socket.on("Asset.Export.Finish", (uuid: string) => {
    window.open(baseAdjust(`/static/temp/${uuid}.paa`));
});

socket.on("Asset.Import.Finish", (name: string) => {
    assetSystem.resolveUpload(name);
    socket.emit("Folder.Get", assetState.currentFolder.value);
});
