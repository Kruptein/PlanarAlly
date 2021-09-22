<script setup lang="ts">
import { nextTick, ref, watchEffect } from "vue";

import { i18n } from "../../../i18n";

import Modal from "./Modal.vue";

const emit = defineEmits(["close", "submit"]);
const props = defineProps<{ visible: boolean; title: string; question: string; error?: string }>();

const { t } = i18n.global;

const answer = ref("");
const input = ref<HTMLInputElement | null>(null);

watchEffect(() => {
    if (props.visible) {
        nextTick(() => input.value!.focus());
    }
});

function reset(): void {
    answer.value = "";
}

function close(): void {
    emit("close");
    reset();
}

function submit(): void {
    emit("submit", answer.value);
    reset();
}
</script>

<template>
    <Modal :visible="visible" @close="close">
        <template v-slot:header="m">
            <div class="modal-header" draggable="true" @dragstart="m.dragStart" @dragend="m.dragEnd">
                {{ title }}
            </div>
        </template>
        <div class="modal-body">
            <div id="question">{{ question }}</div>
            <div id="error" v-if="error">{{ error }}</div>
            <input type="text" ref="input" v-model="answer" @keyup.enter="submit" />
        </div>
        <div class="modal-footer">
            <button @click="submit">{{ t("common.submit") }}</button>
        </div>
    </Modal>
</template>

<style scoped>
.modal-header {
    background-color: #ff7052;
    padding: 10px;
    font-size: 20px;
    font-weight: bold;
    cursor: move;
}

.modal-body {
    padding: 10px;
    padding-bottom: 0;
    display: flex;
    flex-direction: column;
}

#question {
    margin-bottom: 20px;
}

#error {
    color: red;
    margin-bottom: 5px;
}

.modal-footer {
    padding: 10px;
    text-align: right;
}
</style>
