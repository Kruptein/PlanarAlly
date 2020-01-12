<template>
    <modal v-if="note !== null" :visible="visible" @close="visible = false" :mask="false">
        <div
            class="modal-header"
            slot="header"
            slot-scope="m"
            draggable="true"
            @dragstart="m.dragStart"
            @dragend="m.dragEnd"
        >
            <span @click="$refs.title.select()">
                <i class="fas fa-pencil-alt" style="font-size: 15px"></i>
            </span>
            <input v-model="note.title" ref="title" @change="updateNote" />
            <div class="header-close" @click="visible = false">
                <i class="far fa-window-close"></i>
            </div>
        </div>
        <div class="modal-body">
            <textarea
                ref="textarea"
                v-model="note.text"
                :style="{ height: calcHeight() }"
                @change="updateNote"
            ></textarea>
        </div>
        <div class="modal-footer">
            <button @click="removeNote">
                <i class="far fa-trash-alt"></i>
                Remove
            </button>
        </div>
    </modal>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import Modal from "@/core/components/modals/modal.vue";
import Game from "@/game/game.vue";

import { Note } from "@/game/comm/types/general";
import { gameStore } from "@/game/store";

@Component({
    components: {
        Modal,
    },
})
export default class NoteDialog extends Vue {
    visible = false;
    note: Note | null = null;

    open(note: Note): void {
        this.visible = true;
        this.note = note;
    }
    calcHeight(): string {
        if (this.$refs.textarea) {
            const el = <HTMLElement>this.$refs.textarea;
            el.style.height = "auto";
            el.style.height = el.scrollHeight + "px";
            // Using the return value without the above did not achieve what I want, so hey /shrug
            return el.scrollHeight + "px";
        }
        return "100px";
    }
    updateNote(): void {
        if (this.note) gameStore.updateNote({ note: this.note, sync: true });
    }
    async removeNote(): Promise<void> {
        const result = await (<Game>this.$parent).$refs.confirm.open("Are you sure you wish to remove this?");
        if (result && this.note) {
            gameStore.removeNote({ note: this.note, sync: true });
            this.visible = false;
        }
    }
}
</script>

<style scoped>
.modal-header {
    background-color: #ff7052;
    padding: 10px;
    font-size: 20px;
    font-weight: bold;
    cursor: move;
}

.modal-header > input {
    background-color: inherit;
    border: none;
    font-weight: bold;
    font-size: large;
}

.header-close {
    position: absolute;
    top: 5px;
    right: 5px;
}

.modal-body {
    padding: 10px;
}

.modal-body > textarea {
    width: 100%;
    min-height: 100px;
    max-height: 500px;
}

.modal-footer {
    padding-top: 0;
    padding: 10px;
    text-align: right;
}
</style>
