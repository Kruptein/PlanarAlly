<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import ConfirmDialog from "@/core/components/modals/confirm.vue";
import Modal from "@/core/components/modals/modal.vue";
import { Note } from "@/game/models/general";
import { gameStore } from "@/game/store";

@Component({
    components: {
        ConfirmDialog,
        Modal,
    },
})
export default class NoteDialog extends Vue {
    $refs!: {
        confirm: ConfirmDialog;
        textarea: HTMLTextAreaElement;
        title: HTMLInputElement;
    };

    visible = false;
    note: Note | null = null;

    open(note: Note): void {
        this.visible = true;
        this.note = note;
        this.$nextTick(() => {
            this.calcHeight();
        });
    }
    calcHeight(): void {
        if (this.$refs.textarea) {
            const el = this.$refs.textarea;
            el.style.height = "auto";
            el.style.height = el.scrollHeight + "px";
        }
    }
    updateNote(): void {
        if (this.note) gameStore.updateNote({ note: this.note, sync: true });
    }
    async removeNote(): Promise<void> {
        const result = await this.$refs.confirm.open(this.$t("game.ui.note.warning_msg").toString());
        if (result && this.note) {
            gameStore.removeNote({ note: this.note, sync: true });
            this.visible = false;
        }
    }
}
</script>

<template>
    <modal v-if="note !== null" :visible="visible" @close="visible = false" :mask="false">
        <ConfirmDialog ref="confirm"></ConfirmDialog>
        <div
            class="modal-header"
            slot="header"
            slot-scope="m"
            draggable="true"
            @dragstart="m.dragStart"
            @dragend="m.dragEnd"
        >
            <span @click="$refs.title.select()" :title="$t('game.ui.note.edit_title')">
                <font-awesome-icon icon="pencil-alt" />
            </span>
            <input v-model="note.title" ref="title" @change="updateNote" />
            <div class="header-close" @click="visible = false" :title="$t('common.close')">
                <font-awesome-icon :icon="['far', 'window-close']" />
            </div>
        </div>
        <div class="modal-body">
            <textarea ref="textarea" v-model="note.text" @input="calcHeight" @change="updateNote"></textarea>
        </div>
        <div class="modal-footer">
            <button @click="removeNote" :title="$t('game.ui.note.remove_note')">
                <font-awesome-icon icon="trash-alt" />
                {{ $t("game.ui.note.remove_note") }}
            </button>
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
