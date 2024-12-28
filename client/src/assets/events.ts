import { useToast } from "vue-toastification";

import type { ApiAssetAdd, ApiAssetCreateShare, ApiAssetFolder, ApiAssetRemoveShare } from "../apiTypes";
import { router } from "../router";
import { coreStore } from "../store/core";

import { sendFolderGet } from "./emits";
import type { AssetId } from "./models";
import { socket } from "./socket";
import { assetState } from "./state";

import { assetSystem } from ".";

let disConnected = false;

const toast = useToast();

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

socket.on("Toast.Warn", (msg: string) => {
    toast.warning(msg);
});

socket.on("Folder.Root.Set", (root: AssetId) => {
    assetSystem.setRoot(root);
});

socket.on("Folder.Set", async (data: ApiAssetFolder) => {
    assetSystem.clear();
    assetSystem.setFolderData(data.folder.id, data.folder);
    assetState.mutableReactive.sharedParent = data.sharedParent;
    assetState.mutableReactive.sharedRight = data.sharedRight;
    if (router.currentRoute.value.name === "assets") {
        if (data.path) assetSystem.setPath(data.path);
        const path = `/assets${assetState.currentFilePath.value}/`;
        if (path !== router.currentRoute.value.path) {
            await router.push({ path });
        }
    }
});

socket.on("Asset.Add", (data: ApiAssetAdd) => {
    assetSystem.addAsset(data.asset, data.parent);
});

socket.on("Asset.Upload.Finish", (data: ApiAssetAdd) => {
    assetSystem.addAsset(data.asset, data.parent);
    assetSystem.resolveUpload(data.asset.name);
});

socket.on("Asset.Import.Finish", (name: string) => {
    assetSystem.resolveUpload(name);
    sendFolderGet(assetState.currentFolder.value);
});

socket.on("Asset.Share.Created", (data: ApiAssetCreateShare) => {
    const assetData = assetState.mutableReactive.idMap.get(data.asset);
    if (assetData) {
        assetData.shares.push({ right: data.right, user: data.user });
    }
});

socket.on("Asset.Share.Edit", (data: ApiAssetCreateShare) => {
    const assetData = assetState.mutableReactive.idMap.get(data.asset);
    if (assetData) {
        for (const share of assetData.shares) {
            if (share.user == data.user) share.right = data.right;
        }
    }
});

socket.on("Asset.Share.Removed", (data: ApiAssetRemoveShare) => {
    const assetData = assetState.mutableReactive.idMap.get(data.asset);
    if (assetData) {
        assetData.shares = assetData.shares.filter((s) => s.user !== data.user);

        const username = coreStore.state.username;
        if (assetData.owner !== username && data.user === username) {
            assetSystem.removeAsset(data.asset);
        }
    }
});
