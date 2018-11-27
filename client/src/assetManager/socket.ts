import * as io from "socket.io-client";

import { Asset } from "../core/comm/types";
import vm from "./assets";

const socket = io.connect(location.protocol + "//" + location.host + "/pa_assetmgmt");
socket.on("connect", () => {
    console.log("Connected");
});
socket.on("disconnect", () => {
    console.log("Disconnected");
});
socket.on("redirect", (destination: string) => {
    console.log("redirecting");
    window.location.href = destination;
});
socket.on("Folder.Root.Set", (root: number) => {
    vm.root = root;
});
socket.on("Folder.Set", (folder: Asset) => {
    vm.folders = [];
    vm.files = [];
    if (folder.children) {
        for (const child of folder.children) {
            vm.idMap.set(child.id, child);
            if (child.file_hash) {
                vm.files.push(child.id);
            } else {
                vm.folders.push(child.id);
            }
        }
    }
});
socket.on("Folder.Create", (folder: Asset) => {
    vm.folders.push(folder.id);
    vm.idMap.set(folder.id, folder);
});
socket.on("Asset.Upload.Finish", (asset: Asset) => {
    vm.idMap.set(asset.id, asset);
    vm.files.push(asset.id);
});

export default socket;
