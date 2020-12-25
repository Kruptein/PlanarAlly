<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import { Socket } from "socket.io-client";
import { mapGetters } from "vuex";

import Modal from "@/core/components/modals/modal.vue";

import { createNewManager } from "../../socket";
import { assetStore } from "../../../assetManager/store";
import { Asset } from "../../comm/types";

@Component({
    components: {
        Modal,
    },
    computed: {
        ...mapGetters("assets", [
            "currentFolder",
            "files",
            "firstSelectedFile",
            "folders",
            "idMap",
            "parentFolder",
            "path",
            "selected",
        ]),
    },
})
export default class AssetPicker extends Vue {
    currentFolder!: number;

    visible = false;
    socket!: Socket;

    mounted(): void {
        this.socket = createNewManager().socket("/pa_assetmgmt");

        this.socket.on("Folder.Root.Set", (root: number) => {
            assetStore.setRoot(root);
        });

        this.socket.on("Folder.Set", (data: { folder: Asset; path?: number[] }) => {
            assetStore.clear();
            assetStore.idMap.set(data.folder.id, data.folder);
            if (data.folder.children) {
                for (const child of data.folder.children) {
                    assetStore.addAsset(child);
                }
            }
        });
    }

    changeDirectory(nextFolder: number): void {
        if (nextFolder < 0) assetStore.folderPath.pop();
        else assetStore.folderPath.push(nextFolder);
        assetStore.clearSelected();
        this.socket.emit("Folder.Get", this.currentFolder);
    }

    select(event: MouseEvent, inode: number): void {
        assetStore.clearSelected();
        if (assetStore.files.includes(inode)) {
            assetStore.selected.push(inode);
        }
    }

    beforeDestroy(): void {
        this.socket.disconnect();
    }

    resolve: (ok: Asset | undefined) => void = (_ok: Asset | undefined) => {};
    reject: () => void = () => {};

    confirm(): void {
        if (assetStore.selected.length !== 1) {
            this.resolve(undefined);
        } else {
            this.resolve(assetStore.idMap.get(assetStore.selected[0]));
        }
        this.close();
    }
    close(): void {
        this.resolve(undefined);
        this.visible = false;
    }
    open(): Promise<Asset | undefined> {
        this.visible = true;

        if (!this.socket.connected) {
            this.socket.connect();
        }

        this.socket.emit("Folder.Get");

        return new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }
}
</script>

<template>
    <modal :visible="visible" @close="close">
        <div
            class="modal-header"
            slot="header"
            slot-scope="m"
            draggable="true"
            @dragstart="m.dragStart"
            @dragend="m.dragEnd"
        >
            Asset Picker
            <div class="header-close" @click="close" :title="$t('common.close')">
                <font-awesome-icon :icon="['far', 'window-close']" />
            </div>
        </div>
        <div class="modal-body">
            <div id="assets">
                <div id="breadcrumbs">
                    <div>/</div>
                    <div v-for="dir in path" :key="dir">{{ idMap.has(dir) ? idMap.get(dir).name : "" }}</div>
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
                        <font-awesome-icon icon="folder" style="font-size: 50px" />
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
                        <font-awesome-icon icon="folder" style="font-size: 50px" />
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
                        <img :src="baseAdjust('/static/assets/' + idMap.get(file).file_hash)" width="50" alt="" />
                        <div class="title">{{ idMap.get(file).name }}</div>
                    </div>
                </div>
            </div>
            <div class="buttons">
                <button @click="confirm" ref="confirm">Select</button>
                <button @click="close" ref="deny">Cancel</button>
            </div>
        </div>
    </modal>
</template>

<style scoped>
.modal-header {
    background-color: #ff7052;
    padding: 10px;
    font-size: 20px;
    font-weight: bold;
    cursor: move;
}

.header-close {
    position: absolute;
    top: 5px;
    right: 5px;
}

.modal-body {
    max-width: 30vw;
    padding: 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
}

#assets {
    max-height: 50vh;
    width: 30vw;
}

.buttons {
    align-self: flex-end;
    margin-top: 15px;
}

button:first-of-type {
    margin-right: 10px;
}

.focus {
    color: #7c253e;
    font-weight: bold;
}
</style>