<script setup lang="ts">
import { useI18n } from "vue-i18n";

import Modal from "../../core/components/modals/Modal.vue";
import { SyncTo } from "../../core/models/types";
import { logicStore } from "../../store/logic";
import { UuidMap } from "../../store/shapeMap";
import { sendDeclineDoorRequest } from "../api/emits/logic";
import { setCenterPosition } from "../position";

const { t } = useI18n();

function close(): void {
    const req = logicStore.state.request;
    if (req === undefined) return;

    sendDeclineDoorRequest(req.requester);
    logicStore.clearRequest();
}

function approve(): void {
    const uuid = logicStore.state.request?.shape;
    if (uuid === undefined) return;
    const shape = UuidMap.get(uuid);
    if (shape === undefined) return;

    shape.setBlocksVision(!shape.blocksVision, SyncTo.SERVER, true);
    shape.setBlocksMovement(!shape.blocksMovement, SyncTo.SERVER, true);
    logicStore.clearRequest();
}

function showDoor(): void {
    const uuid = logicStore.state.request?.shape;
    if (uuid === undefined) return;
    const shape = UuidMap.get(uuid);
    if (shape === undefined) return;
    shape.showHighlight = true;
    setCenterPosition(shape.center());
}
</script>

<template>
    <Modal :visible="logicStore.state.request !== undefined" @close="close" :mask="false">
        <template v-slot:header="m">
            <div class="modal-header" draggable="true" @dragstart="m.dragStart" @dragend="m.dragEnd">
                Request Handler
                <div class="header-close" @click="close" :title="t('common.close')">
                    <font-awesome-icon :icon="['far', 'window-close']" />
                </div>
            </div>
        </template>
        <div class="modal-body">
            <div>You got a request from {{ logicStore.state.request?.requester }} to open a door.</div>
            <div class="buttons">
                <button @click="showDoor">Show door</button>
                <button @click="approve">Approve</button>
                <button @click="close" class="focus">Decline</button>
            </div>
        </div>
    </Modal>
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
    padding: 10px;
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
