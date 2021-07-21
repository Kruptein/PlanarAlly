<script setup lang="ts">
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { defineEmit, defineProps, watchEffect } from "vue";

import { socket } from "../../../assetManager/socket";
import { assetStore } from "../../../assetManager/state";
import { i18n } from "../../../i18n";
import { baseAdjust } from "../../utils";

import Modal from "./Modal.vue";

const props = defineProps({
    visible: { type: Boolean, required: true },
});
const emit = defineEmit(["submit", "close"]);

const { t } = i18n.global;

const state = assetStore.state;

watchEffect(() => {
    if (props.visible) {
        assetStore.clear();
        assetStore.clearSelected();
        assetStore.clearFolderPath();
        assetStore.setModalActive(true);
        if (!socket.connected) socket.connect();
        socket.emit("Folder.Get");
    } else {
        if (socket.connected) socket.disconnect();
    }
});

function showIdName(dir: number): string {
    return state.idMap.get(dir)?.name ?? "";
}

function getIdImageSrc(file: number): string {
    return baseAdjust("/static/assets/" + state.idMap.get(file)!.file_hash);
}

function select(event: MouseEvent, inode: number): void {
    assetStore.clearSelected();
    if (assetStore.state.files.includes(inode)) {
        assetStore.addSelectedInode(inode);
    }
}

function changeDirectory(folder: number): void {
    assetStore.changeDirectory(folder);
}
</script>

<template>
    <modal :visible="visible" @close="emit('close')">
        <template v-slot:header="m">
            <div class="modal-header" draggable="true" @dragstart="m.dragStart" @dragend="m.dragEnd">
                Asset Picker
                <div class="header-close" @click="emit('close')" :title="t('common.close')">
                    <font-awesome-icon :icon="['far', 'window-close']" />
                </div>
            </div>
        </template>
        <div class="modal-body">
            <div id="assets">
                <div id="breadcrumbs">
                    <div>/</div>
                    <div v-for="dir in state.folderPath" :key="dir">{{ showIdName(dir) }}</div>
                </div>
                <div id="explorer">
                    <div class="inode folder" v-if="state.folderPath.length" @dblclick="changeDirectory(-1)">
                        <font-awesome-icon icon="folder" style="font-size: 50px" />
                        <div class="title">..</div>
                    </div>
                    <div
                        class="inode folder"
                        draggable="true"
                        v-for="key in state.folders"
                        :key="key"
                        :class="{ 'inode-selected': state.selected.includes(key) }"
                        @click="select($event, key)"
                        @dblclick="changeDirectory(key)"
                    >
                        <font-awesome-icon icon="folder" style="font-size: 50px" />
                        <div class="title">{{ showIdName(key) }}</div>
                    </div>
                    <div
                        class="inode file"
                        draggable="true"
                        v-for="file in state.files"
                        :key="file"
                        :class="{ 'inode-selected': state.selected.includes(file) }"
                        @click="select($event, file)"
                    >
                        <img :src="getIdImageSrc(file)" width="50" alt="" />
                        <div class="title">{{ showIdName(file) }}</div>
                    </div>
                </div>
            </div>
            <div class="buttons">
                <button @click="emit('submit')">Select</button>
                <button @click="emit('close')">Cancel</button>
            </div>
        </div>
    </modal>
</template>

<style scoped lang="scss">
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

    #explorer {
        max-height: 54vh;
    }
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
