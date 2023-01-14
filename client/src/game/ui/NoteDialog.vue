<script setup lang="ts">
import { ref, toRef } from "vue";
import { useI18n } from "vue-i18n";

import Modal from "../../core/components/modals/Modal.vue";
import { useModal } from "../../core/plugins/modals/plugin";
import { noteSystem } from "../systems/notes";
import { uiState } from "../systems/ui/state";

defineProps<{ visible: boolean }>();
const emit = defineEmits(["update:visible"]);

const textarea = ref<HTMLTextAreaElement | null>(null);
const title = ref<HTMLInputElement | null>(null);

const { t } = useI18n();
const modals = useModal();

const note = toRef(uiState.reactive, "activeNote");

function calcHeight(): void {
    if (textarea.value !== null) {
        textarea.value.style.height = "auto";
        textarea.value.style.height = textarea.value.scrollHeight + "px";
    }
}

function setText(event: Event): void {
    noteSystem.updateNote({ ...note.value, text: (event.target as HTMLTextAreaElement).value }, true);
}

function setTitle(event: Event): void {
    noteSystem.updateNote({ ...note.value, title: (event.target as HTMLInputElement).value }, true);
}

async function removeNote(): Promise<void> {
    const doRemove = await modals.confirm(t("game.ui.NoteDialog.warning_msg"));
    if (doRemove === true) {
        noteSystem.removeNote(note.value, true);
        close();
    }
}

function close(): void {
    emit("update:visible", false);
}
</script>

<template>
    <Modal v-if="note !== undefined" :visible="visible" :mask="false" @close="close">
        <template #header="m">
            <div class="modal-header" draggable="true" @dragstart="m.dragStart" @dragend="m.dragEnd">
                <span :title="t('game.ui.NoteDialog.edit_title')" @click="title?.select()">
                    <font-awesome-icon icon="pencil-alt" />
                </span>
                <input ref="title" :value="note.title" @change="setTitle" />
                <div class="header-close" :title="t('common.close')" @click.stop="close">
                    <font-awesome-icon :icon="['far', 'window-close']" />
                </div>
            </div>
        </template>
        <div class="modal-body">
            <textarea ref="textarea" :value="note.text" @input="calcHeight" @change="setText"></textarea>
        </div>
        <div class="modal-footer">
            <button :title="t('game.ui.NoteDialog.remove_note')" @click="removeNote">
                <font-awesome-icon icon="trash-alt" />
                {{ t("game.ui.NoteDialog.remove_note") }}
            </button>
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

    > input {
        background-color: inherit;
        border: none;
        font-weight: bold;
        font-size: large;
        margin-left: 5px;
    }
}

.header-close {
    position: absolute;
    top: 5px;
    right: 5px;
}

.modal-body {
    padding: 10px;

    > textarea {
        width: 100%;
        min-height: 100px;
        max-height: 500px;
    }
}

.modal-footer {
    padding: 10px;
    text-align: right;
}
</style>
