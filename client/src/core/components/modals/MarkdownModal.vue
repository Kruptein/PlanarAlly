<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import VueMarkdown from "vue-markdown-render";

import Modal from "./Modal.vue";

defineProps<{ title: string; source: string }>();

const { t } = useI18n();

const visible = ref(true);

function close(): void {
    visible.value = false;
}
</script>

<template>
    <Modal :visible="visible" @close="close">
        <template #header="m">
            <div class="modal-header" draggable="true" @dragstart="m.dragStart" @dragend="m.dragEnd">
                <div>{{ title }}</div>
                <div class="header-close" :title="t('common.close')" @click="close">
                    <font-awesome-icon :icon="['far', 'window-close']" />
                </div>
            </div>
        </template>
        <div class="modal-body">
            <VueMarkdown :source="source" />
        </div>
    </Modal>
</template>

<style scoped>
.modal-header {
    color: white;
    background-color: #7c253e;
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
    max-height: 50vh;
    max-width: 35vw;
    overflow-y: scroll;
    padding: 30px;
    display: flex;
    justify-content: space-between;
}
</style>
