import type { ApiAssetCreateFolderResponse, ApiAssetFolder, ApiAssetUploadFinish } from "../apiTypes";
import { baseAdjust } from "../core/http";
import { router } from "../router";

import { sendFolderGet } from "./emits";
import type { AssetId } from "./models";
import { socket } from "./socket";
import { assetState } from "./state";

import { assetSystem } from ".";

let disConnected = false;

socket.on("connect", () => {
    console.log("[Assets] connected");
    if (disConnected) sendFolderGet(assetState.currentFolder.value);
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

socket.on("Folder.Set", async (data: ApiAssetFolder) => {
    assetSystem.clear();
    assetSystem.setFolderData(data.folder.id, data.folder);
    assetState.mutableReactive.sharedParent = data.sharedParent;
    assetState.mutableReactive.sharedRight = data.sharedRight;
    if (!assetState.readonly.modalActive) {
        if (data.path) assetSystem.setPath(data.path);
        const path = `/assets${assetState.currentFilePath.value}/`;
        if (path !== router.currentRoute.value.path) {
            await router.push({ path });
        }
    }
});

socket.on("Folder.Create", (data: ApiAssetCreateFolderResponse) => {
    assetSystem.addAsset(data.asset, data.parent);
});

socket.on("Asset.Upload.Finish", (data: ApiAssetUploadFinish) => {
    assetSystem.addAsset(data.asset, data.parent);
    assetSystem.resolveUpload(data.asset.name);
});

socket.on("Asset.Export.Finish", (uuid: string) => {
    window.open(baseAdjust(`/static/temp/${uuid}.paa`));
});

socket.on("Asset.Import.Finish", (name: string) => {
    assetSystem.resolveUpload(name);
    sendFolderGet(assetState.currentFolder.value);
});
