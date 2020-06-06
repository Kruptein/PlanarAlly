<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import { Route, NavigationGuard } from "vue-router";
import { mapGetters } from "vuex";

import AssetContextMenu from "@/assetManager/contextMenu.vue";
import ConfirmDialog from "@/core/components/modals/confirm.vue";
import Prompt from "@/core/components/modals/prompt.vue";

import { socket } from "@/assetManager/socket";
import { assetStore } from "@/assetManager/store";
import { Asset } from "@/core/comm/types";
import { uuidv4 } from "@/core/utils";

Component.registerHooks(["beforeRouteEnter"]);

@Component({
    components: {
        Prompt,
        ConfirmDialog,
        AssetContextMenu,
    },
    computed: {
        ...mapGetters("assets", [
            "currentFolder",
            "expectedUploads",
            "files",
            "firstSelectedFile",
            "folders",
            "idMap",
            "parentFolder",
            "path",
            "resolvedUploads",
            "selected",
        ]),
    },
    beforeRouteLeave(to, from, next) {
        socket.disconnect();
        next();
    },
})
export default class AssetManager extends Vue {
    currentFolder!: number;
    fildes!: number[];
    firstSelectedFile!: Asset | null;
    folders!: number[];
    idMap!: Map<number, Asset>;
    parentFolder!: number;
    path!: number[];
    selected!: number[];

    draggingSelection = false;

    beforeRouteEnter(to: Route, _from: Route, next: Parameters<NavigationGuard>[2]): void {
        socket.connect();
        socket.emit("Folder.GetByPath", to.path.slice("/assets".length));
        next();
    }

    changeDirectory(nextFolder: number): void {
        if (nextFolder < 0) assetStore.folderPath.pop();
        else assetStore.folderPath.push(nextFolder);
        assetStore.clearSelected();
        socket.emit("Folder.Get", this.currentFolder);
    }
    createDirectory(): void {
        const name = window.prompt(this.$t("assetManager.manager.new_folder_name").toString());
        if (name !== null) {
            socket.emit("Folder.Create", { name, parent: this.currentFolder });
        }
    }
    moveInode(inode: number, target: number): void {
        if (assetStore.files.includes(inode)) assetStore.files.splice(assetStore.files.indexOf(inode), 1);
        else assetStore.folders.splice(assetStore.folders.indexOf(inode), 1);
        assetStore.idMap.delete(inode);
        socket.emit("Inode.Move", { inode, target });
    }
    select(event: MouseEvent, inode: number): void {
        if (event.shiftKey && assetStore.selected.length > 0) {
            const inodes = [...assetStore.files, ...assetStore.folders];
            const start = inodes.indexOf(assetStore.selected[assetStore.selected.length - 1]);
            const end = inodes.indexOf(inode);
            for (let i = start; i !== end; start < end ? i++ : i--) {
                if (i === start) continue;
                assetStore.selected.push(inodes[i]);
            }
            assetStore.selected.push(inodes[end]);
        } else {
            if (!event.ctrlKey) {
                assetStore.clearSelected();
            }
            assetStore.selected.push(inode);
        }
    }
    startDrag(event: DragEvent, file: number): void {
        if (event.dataTransfer === null) return;
        event.dataTransfer.setData("Hack", "ittyHack");
        event.dataTransfer.dropEffect = "move";
        if (!assetStore.selected.includes(file)) assetStore.selected.push(file);
        this.draggingSelection = true;
    }
    moveDrag(event: DragEvent): void {
        if ((<HTMLElement>event.target).classList.contains("folder"))
            (<HTMLElement>event.target).classList.add("inode-selected");
    }
    leaveDrag(event: DragEvent): void {
        if ((<HTMLElement>event.target).classList.contains("folder"))
            (<HTMLElement>event.target).classList.remove("inode-selected");
    }
    stopDrag(event: DragEvent, target: number): void {
        (<HTMLElement>event.target).classList.remove("inode-selected");
        if (this.draggingSelection) {
            if (
                (target === assetStore.root || assetStore.folders.includes(target)) &&
                !assetStore.selected.includes(target)
            ) {
                for (const inode of assetStore.selected) {
                    this.moveInode(inode, target);
                }
            }
            assetStore.clearSelected();
        } else if (event.dataTransfer && event.dataTransfer.files.length > 0) {
            this.upload(event.dataTransfer.files, target);
        }
        this.draggingSelection = false;
    }
    prepareUpload(): void {
        document.getElementById("files")!.click();
    }
    upload(fls?: FileList, target?: number): void {
        const files = (<HTMLInputElement>document.getElementById("files")!).files;
        if (fls === undefined) {
            if (files) fls = files;
            else return;
        }
        assetStore.addExpectedUploads(fls.length);
        if (target === undefined) target = this.currentFolder;
        const CHUNK_SIZE = 100000;
        for (const file of fls) {
            const uuid = uuidv4();
            const slices = Math.ceil(file.size / CHUNK_SIZE);
            assetStore._pendingUploads.push(file.name);
            for (let slice = 0; slice < slices; slice++) {
                const fr = new FileReader();
                fr.readAsArrayBuffer(
                    file.slice(
                        slice * CHUNK_SIZE,
                        slice * CHUNK_SIZE + Math.min(CHUNK_SIZE, file.size - slice * CHUNK_SIZE),
                    ),
                );
                fr.onload = _e => {
                    socket.emit("Asset.Upload", {
                        name: file.name,
                        directory: target,
                        data: fr.result,
                        slice,
                        totalSlices: slices,
                        uuid,
                    });
                };
            }
        }
    }
}
</script>

<template>
    <div id="AssetManager" v-cloak>
        <div id="titlebar" v-t="'assetManager.manager.title'"></div>
        <div id="progressbar" v-show="expectedUploads > 0 && expectedUploads !== resolvedUploads">
            <div id="progressbar-label">
                {{ $t("assetManager.manager.uploading") }} {{ resolvedUploads }} / {{ expectedUploads }}
            </div>
            <div id="progressbar-meter">
                <span :style="{ width: (resolvedUploads / expectedUploads) * 100 + '%' }"></span>
            </div>
        </div>
        <div id="assets" @dragover.prevent="moveDrag" @drop.prevent.stop="stopDrag($event, currentFolder)">
            <div id="breadcrumbs">
                <div>/</div>
                <div v-for="dir in path" :key="dir">{{ idMap.has(dir) ? idMap.get(dir).name : "" }}</div>
            </div>
            <div id="actionbar">
                <input id="files" type="file" multiple hidden @change="upload()" />
                <div @click="createDirectory" :title="$t('assetManager.manager.create_folder')">
                    <i aria-hidden="true" class="fas fa-plus-square"></i>
                </div>
                <div @click="prepareUpload" :title="$t('assetManager.manager.upload_files')">
                    <i aria-hidden="true" class="fas fa-upload"></i>
                </div>
            </div>
            <div id="explorer">
                <div
                    class="inode folder"
                    v-if="path.length"
                    @dblclick="changeDirectory(-1)"
                    @dragover.prevent="moveDrag"
                    @dragleave.prevent="leaveDrag"
                    @drop.prevent.stop="stopDrag($event, parentFolder)"
                >
                    <i aria-hidden="true" class="fas fa-folder" style="font-size: 50px;"></i>
                    <div class="title">..</div>
                </div>
                <div
                    class="inode folder"
                    draggable="true"
                    v-for="key in folders"
                    :key="key"
                    :class="{ 'inode-selected': selected.includes(key) }"
                    @click="select($event, key)"
                    @dblclick="changeDirectory(key)"
                    @contextmenu.prevent="$refs.cm.open($event, key)"
                    @dragstart="startDrag($event, key)"
                    @dragover.prevent="moveDrag"
                    @dragleave.prevent="leaveDrag"
                    @drop.prevent.stop="stopDrag($event, key)"
                >
                    <i aria-hidden="true" class="fas fa-folder" style="font-size: 50px;"></i>
                    <div class="title">{{ idMap.get(key).name }}</div>
                </div>
                <div
                    class="inode file"
                    draggable="true"
                    v-for="file in files"
                    :key="file"
                    :class="{ 'inode-selected': selected.includes(file) }"
                    @click="select($event, file)"
                    @contextmenu.prevent="$refs.cm.open($event, file)"
                    @dragstart="startDrag($event, file)"
                >
                    <img :src="'/static/assets/' + idMap.get(file).file_hash" width="50" alt="" />
                    <div class="title">{{ idMap.get(file).name }}</div>
                </div>
            </div>
        </div>
        <AssetContextMenu ref="cm"></AssetContextMenu>
        <Prompt ref="prompt"></Prompt>
        <ConfirmDialog ref="confirm"></ConfirmDialog>
    </div>
</template>

<style>
[v-cloak],
[v-cloak] * {
    display: none;
}

html,
body {
    padding: 0;
    margin: 0;
    width: 100%;
    height: 100%;
    background: url("/static/img/login_background.png") repeat fixed;
    font-family: "Open Sans", sans-serif;
}

#AssetManager {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
}

#titlebar {
    padding: 15px;
    margin: 10px;
    font-size: 30px;
    font-weight: bold;
    background-color: #ff7052;
    color: #fff;
    text-align: center;
    border: solid 1px black;
    box-shadow: 2px 2px gray;
}

#progressbar {
    margin: 10px;
    display: flex;
    flex-direction: row;
    border: solid 1px black;
    box-shadow: 2px 2px gray;
}

#progressbar-label {
    padding: 10px 15px;
    background-color: #ff7052;
}

#progressbar-meter {
    background-color: white;
    padding: 5px;
    flex-grow: 2;
}

#progressbar-meter > span {
    display: block;
    height: 100%;
    position: relative;
    overflow: hidden;
    /* background-color: #ff7052;
    background-image: linear-gradient(center bottom, #ff7052 37%, white 69%); */
    background-color: #ff7052;
    background-image: linear-gradient(to bottom, #ff7052 37%, #ff7052 69%);
    box-shadow: inset 0 2px 9px rgba(255, 255, 255, 0.3), inset 0 -2px 6px rgba(0, 0, 0, 0.4);
}

#progressbar-meter > span:after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    background-image: linear-gradient(
        -45deg,
        rgba(255, 255, 255, 0.2) 25%,
        transparent 25%,
        transparent 50%,
        rgba(255, 255, 255, 0.2) 50%,
        rgba(255, 255, 255, 0.2) 75%,
        transparent 75%,
        transparent
    );
    z-index: 1;
    background-size: 50px 50px;
    overflow: hidden;
    animation: move 2s linear infinite;
}

@keyframes move {
    0% {
        background-position: 0 0;
    }
    100% {
        background-position: 50px 50px;
    }
}

#assets,
#asset-details {
    background-color: white;
    border: solid 1px black;
    margin: 10px;
    position: relative;
    padding-top: 45px;
    padding-bottom: 45px;
    box-shadow: 3px 3px gray;
}

#assets {
    flex-grow: 1;
}

#asset-details {
    display: flex;
    flex-direction: column;
    padding: 15px;
    max-width: 50%;
    overflow: scroll;
}

#asset-details img {
    width: 100%;
}

#breadcrumbs {
    position: absolute;
    left: 0;
    top: 0;
    display: flex;
    overflow: hidden;
    z-index: 1;
    background-color: #ff7052;
    color: white;
    align-items: center;
    padding: 5px;
    border-bottom-right-radius: 10px;
}

#breadcrumbs > div {
    position: relative;
    padding: 10px;
    padding-left: 20px;
    text-align: center;
}

#breadcrumbs > div:first-child {
    padding-left: 10px;
}

#breadcrumbs div:last-child::after {
    content: none;
}

#breadcrumbs div::after {
    content: "";
    position: absolute;
    display: inline-block;
    width: 30px;
    height: 30px;
    top: 3px;
    right: -10px;
    background-color: transparent;
    border-top-right-radius: 5px;
    -webkit-transform: scale(0.707) rotate(45deg);
    transform: scale(0.707) rotate(45deg);
    box-shadow: 1px -1px rgba(0, 0, 0, 0.25);
    z-index: 1;
}

#actionbar {
    position: absolute;
    right: 0;
    top: 0;
    padding: 8px;
    border-bottom-left-radius: 10px;
    background-color: #ff7052;
    display: flex;
    justify-content: center;
    align-items: center;
    color: white;
}

#actionbar > div {
    margin: 5px;
}

#actionbar > div:hover {
    cursor: pointer;
}

#explorer {
    position: relative;
    left: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(105px, 1fr));
    max-width: 100%;
    max-height: 100%;
    overflow: auto;
}

.inode {
    user-select: none;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 15px;
}
.inode:hover,
.inode-selected {
    cursor: pointer;
    background-color: #ff7052;
}
.inode * {
    pointer-events: none;
}
.title {
    word-break: break-all;
}

#asset-detail-title {
    font-weight: bold;
    font-size: 30px;
    border-bottom: solid 2px black;
    margin-bottom: 15px;
    text-align: center;
}
</style>
